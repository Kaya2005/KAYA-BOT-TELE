// ==========================================
// FICHIER : commandtele/welcome.js
// ==========================================

const welcomeStates = new Map();

async function checkAdmin(ctx) {
    if (!ctx.chat || ctx.chat.type === 'private') return true;
    try {
        const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
        return ['creator', 'administrator'].includes(member.status);
    } catch (err) {
        console.error("[WELCOME] Erreur vérification admin :", err);
        return false;
    }
}

// Fonction partagée pour afficher le panneau de configuration
async function handleWelcomeConfig(ctx) {
    if (!ctx.chat || !['supergroup', 'group'].includes(ctx.chat.type)) {
        return ctx.reply("Cette commande s'utilise uniquement dans un groupe.");
    }

    if (!(await checkAdmin(ctx))) {
        return ctx.reply("⚠️ Seuls les administrateurs peuvent configurer le module welcome.");
    }

    const chatId = ctx.chat.id;
    const currentState = welcomeStates.get(chatId) ?? true;
    const statusText = currentState ? "🟢 Activé (ON)" : "🔴 Désactivé (OFF)";

    const text = `⚙️ **Gestion du module Welcome**\n\nStatut actuel : ${statusText}\n\nChoisissez une option :`;
    const keyboard = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Welcome ON', callback_data: 'welcome_on' },
                    { text: '❌ Welcome OFF', callback_data: 'welcome_off' }
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

export default function setupWelcome(bot) {
    // Déclencheur par commande (/welcome) et texte simple (welcome)
    bot.command('welcome', handleWelcomeConfig);
    bot.hears(/^welcome$/i, handleWelcomeConfig);

    // Déclencheur via le bouton du groupmenu
    bot.action('menu_welcome', async (ctx) => {
        await ctx.answerCbQuery();
        await handleWelcomeConfig(ctx);
    });

    // Gestion des clics sur ON / OFF
    bot.action(/^welcome_(on|off)$/, async (ctx) => {
        try {
            if (!(await checkAdmin(ctx))) {
                return await ctx.answerCbQuery("⚠️ Action réservée aux administrateurs !", { show_alert: true });
            }

            const action = ctx.match[1];
            const chatId = ctx.chat.id;
            const newState = action === 'on';

            welcomeStates.set(chatId, newState);

            const statusText = newState ? "🟢 Le module Welcome a été **ACTIVÉ**." : "🔴 Le module Welcome a été **DÉSACTIVÉ**.";

            await ctx.answerCbQuery(newState ? "Welcome activé !" : "Welcome désactivé !");
            await ctx.editMessageText(statusText, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [] }
            });
        } catch (err) {
            console.error("[WELCOME ACTION ERROR]:", err);
            await ctx.answerCbQuery("Une erreur est survenue.", { show_alert: true });
        }
    });

    // Envoi du message de bienvenue aux nouveaux membres
    bot.on('new_chat_members', async (ctx, next) => {
        try {
            if (!ctx.message || !ctx.message.new_chat_members) {
                return next();
            }

            const chatId = ctx.chat.id;
            const isEnabled = welcomeStates.get(chatId) ?? true;
            if (!isEnabled) {
                return next();
            }

            for (const member of ctx.message.new_chat_members) {
                if (ctx.botInfo && member.id === ctx.botInfo.id) continue;

                const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ');
                const username = member.username ? `@${member.username}` : 'Aucun';
                const id = member.id;

                const now = new Date();
                const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const date = now.toLocaleDateString('fr-FR');

                const welcomeText = `▰▰▰▰▰▰▰▰▰▰
➠ ᴜsᴇʀ : ${fullName}
➠ ᴛɪᴍᴇ : ${time}
➠ ᴅᴀᴛᴇ : ${date}

    🇼​🇪​🇱​🇨​🇴​🇲​🇪​ 
╭▰▰▰▰▰▰▰◈
┆❏ 🙋 ᴜsᴇʀɴᴀᴍᴇ : ${username}
┆❏ 🆔 ɪᴅ : ${id}
╰▰▰▰▰▰▰▰◈`;

                const channelButton = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙰𝙽𝙰𝙻', url: 'https://t.me/kayatech2' }]
                        ]
                    }
                };

                let photoFileId = null;
                try {
                    const profilePhotos = await ctx.telegram.getUserProfilePhotos(member.id, { limit: 1 });
                    if (profilePhotos && profilePhotos.total_count > 0) {
                        const photos = profilePhotos.photos[0];
                        photoFileId = photos[photos.length - 1].file_id;
                    }
                } catch (e) {
                    console.error("Impossible de récupérer la photo de profil :", e);
                }

                if (photoFileId) {
                    await ctx.replyWithPhoto(photoFileId, { 
                        caption: welcomeText,
                        ...channelButton 
                    });
                } else {
                    await ctx.reply(welcomeText, channelButton);
                }
            }
            
            return next();
        } catch (err) {
            console.error("[WELCOME ERROR CRITICAL]:", err);
            return next();
        }
    });
}
