// ==========================================
// FILE : commandtele/antilink.js
// ==========================================

const antilinkStates = new Map();

async function checkAdmin(ctx) {
    if (!ctx.chat || ctx.chat.type === 'private') return true;
    try {
        const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
        return ['creator', 'administrator'].includes(member.status);
    } catch (err) {
        console.error("[ANTILINK] Admin check error:", err);
        return false;
    }
}

// Shared function to display the configuration panel
async function handleAntiLinkConfig(ctx) {
    if (!ctx.chat || !['supergroup', 'group'].includes(ctx.chat.type)) {
        return ctx.reply("This command can only be used in a group.");
    }

    if (!(await checkAdmin(ctx))) {
        return ctx.reply("⚠️ Only administrators can configure the anti-link module.");
    }

    const chatId = ctx.chat.id;
    const currentState = antilinkStates.get(chatId) ?? false;
    const statusText = currentState ? "🟢 Enabled (ON)" : "🔴 Disabled (OFF)";

    const text = `⚙️ **AntiLink Module Management**\n\nCurrent Status: ${statusText}\n\nChoose an option:`;
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
    // Triggered by command (/antilink) and plain text (antilink)
    bot.command('antilink', handleAntiLinkConfig);
    bot.hears(/^antilink$/i, handleAntiLinkConfig);

    // Triggered via groupmenu button
    bot.action('menu_antilink', async (ctx) => {
        await ctx.answerCbQuery();
        await handleAntiLinkConfig(ctx);
    });

    // Handling ON / OFF clicks
    bot.action(/^antilink_(on|off)$/, async (ctx) => {
        try {
            if (!(await checkAdmin(ctx))) {
                return await ctx.answerCbQuery("⚠️ Action restricted to administrators!", { show_alert: true });
            }

            const action = ctx.match[1];
            const chatId = ctx.chat.id;
            const newState = action === 'on';

            antilinkStates.set(chatId, newState);

            const statusText = newState ? "🟢 The AntiLink module has been **ENABLED**." : "🔴 The AntiLink module has been **DISABLED**.";

            await ctx.answerCbQuery(newState ? "AntiLink enabled!" : "AntiLink disabled!");
            await ctx.editMessageText(statusText, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [] }
            });
        } catch (err) {
            console.error("[ANTILINK ACTION ERROR]:", err);
            await ctx.answerCbQuery("An error occurred.", { show_alert: true });
        }
    });

    // Monitoring links
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
                    console.error("[ANTILINK] Error verifying admin:", err);
                    return next();
                }

                await ctx.deleteMessage().catch(() => {});
                
                const warning = await ctx.reply(`⚠️ @${ctx.from.username || ctx.from.first_name}, links are not allowed here!`);
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
