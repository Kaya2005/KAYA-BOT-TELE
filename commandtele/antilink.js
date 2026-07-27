// ==========================================
// FICHIER : commandtele/antilink.js
// ==========================================

const antilinkStates = new Map();

async function checkAdmin(ctx) {
    if (!ctx.chat || ctx.chat.type === 'private') return true;
    try {
        const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
        return ['creator', 'administrator'].includes(member.status);
    } catch (err) {
        console.error("[ANTILINK] Erreur vérification admin :", err);
        return false;
    }
}

// Fonction partagée pour afficher le panneau de configuration
async function handleAntiLinkConfig(ctx) {
    if (!ctx.chat || !['supergroup', 'group'].includes(ctx.chat.type)) {
        return ctx.reply("Cette commande s'utilise uniquement dans un groupe.");
    }

    if (!(await checkAdmin(ctx))) {
        return ctx.reply("⚠️ Seuls les administrateurs peuvent configurer le module antilink.");
    }

    const chatId = ctx.chat.id;
    const currentState = antilinkStates.get(chatId) ?? false;
    const statusText = currentState ? "🟢 Activé (ON)" : "🔴 Désactivé (OFF)";

    const text = `⚙️ **Gestion du module AntiLink**\n\nStatut actuel : ${statusText}\n\nChoisissez une option :`;
    const keyboard = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ AntiLink ON', callback_data: 'antilink_on' },
                    { text: '❌ AntiLink OFF', callback_data: 'antilink_off' }
                ]
            ]
        }
    };

    if (ctx.callbackQuery) {
        await ctx.editMessageText(text, keyboard).catch(() => ctx.reply(text, keyboard));
    } else {
        await ctx.reply(text, keyboard);
    }
}

export default function setupAntiLink(bot) {
    // Déclencheur par commande (/antilink) et texte simple (antilink)
    bot.command('antilink', handleAntiLinkConfig);
    bot.hears(/^antilink$/i, handleAntiLinkConfig);

    // Déclencheur via le bouton du groupmenu
    bot.action('menu_antilink', async (ctx) => {
        await ctx.answerCbQuery();
        await handleAntiLinkConfig(ctx);
    });

    // Gestion des clics sur ON / OFF
    bot.action(/^antilink_(on|off)$/, async (ctx) => {
        try {
            if (!(await checkAdmin(ctx))) {
                return await ctx.answerCbQuery("⚠️ Action réservée aux administrateurs !", { show_alert: true });
            }

            const action = ctx.match[1];
            const chatId = ctx.chat.id;
            const newState = action === 'on';

            antilinkStates.set(chatId, newState);

            const statusText = newState ? "🟢 Le module AntiLink a été **ACTIVÉ**." : "🔴 Le module AntiLink a été **DÉSACTIVÉ**.";

            await ctx.answerCbQuery(newState ? "AntiLink activé !" : "AntiLink désactivé !");
            await ctx.editMessageText(statusText, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [] }
            });
        } catch (err) {
            console.error("[ANTILINK ACTION ERROR]:", err);
            await ctx.answerCbQuery("Une erreur est survenue.", { show_alert: true });
        }
    });

    // Surveillance des liens
    bot.on('message', async (ctx, next) => {
        try {
            if (!ctx.chat || !['supergroup', 'group'].includes(ctx.chat.type)) {
                return next();
            }

            const chatId = ctx.chat.id;
            const isEnabled = antilinkStates.get(chatId) ?? false;
            if (!isEnabled) {
                return next();
            }

            if (!ctx.message || !ctx.message.text) {
                return next();
            }

            const text = ctx.message.text;
            const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(t\.me\/[^\s]+)/gi;

            if (linkRegex.test(text)) {
                if (ctx.sender_chat && ctx.sender_chat.id === ctx.chat.id) {
                    return next(); 
                }

                try {
                    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
                    if (['creator', 'administrator'].includes(member.status)) {
                        return next();
                    }
                } catch (err) {
                    console.error("[ANTILINK] Erreur lors de la vérification de l'admin :", err);
                    return next();
                }

                await ctx.deleteMessage().catch(() => {});
                
                const warning = await ctx.reply(`⚠️ @${ctx.from.username || ctx.from.first_name}, les liens sont interdits ici !`);
                setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, warning.message_id).catch(() => {}), 4000);
                
                return;
            }

            return next();
            
        } catch (err) {
            console.error("[ANTILINK ERROR]", err);
            return next();
        }
    });
}
