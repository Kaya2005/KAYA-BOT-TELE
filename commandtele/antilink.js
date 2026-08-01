// ==========================================
// FILE : commandtele/antilink.js
// ==========================================

const antilinkStates = new Map();

// Structure de configuration par chat:
// { enabled: boolean, mode: 'delete' | 'restrict', duration: number (en secondes) }
function getConfig(chatId) {
    if (!antilinkStates.has(chatId)) {
        antilinkStates.set(chatId, { enabled: false, mode: 'delete', duration: 300 }); // 300s = 5 minutes par défaut
    }
    return antilinkStates.get(chatId);
}

async function checkAdmin(ctx) {
    if (!ctx.chat || ctx.chat.type === 'private') return true;
    
    // Autoriser automatiquement les administrateurs anonymes / propriétaires de canal
    if (ctx.sender_chat || (ctx.from && ctx.from.id === 1087968824)) {
        return true;
    }

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
        return ctx.reply("<blockquote>This command can only be used in a group.</blockquote>", { 
            parse_mode: 'HTML', 
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    if (!(await checkAdmin(ctx))) {
        return ctx.reply("<blockquote>⚠️ Only administrators can configure the anti-link module.</blockquote>", { 
            parse_mode: 'HTML', 
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    const chatId = ctx.chat.id;
    const config = getConfig(chatId);
    
    const statusText = config.enabled ? "🟢 Enabled (ON)" : "🔴 Disabled (OFF)";
    const modeText = config.mode === 'restrict' ? `🛡️ Restrict (${Math.round(config.duration / 60)} min)` : "🗑️ Delete only";

    const text = `<blockquote>⚙️ <b>AntiLink Module Management</b>\n\nCurrent Status: ${statusText}\nMode: ${modeText}\n\nChoose an option:</blockquote>`;
    
    const keyboard = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: config.enabled ? '❌ Turn OFF' : '✅ Turn ON', callback_data: config.enabled ? 'antilink_off' : 'antilink_on' },
                    { text: config.mode === 'restrict' ? '🔄 Mode: Delete' : '🔄 Mode: Restrict', callback_data: config.mode === 'restrict' ? 'antilink_mode_delete' : 'antilink_mode_restrict' }
                ],
                ...(config.mode === 'restrict' ? [[
                    { text: '⏱️ 5m', callback_data: 'antilink_dur_300' },
                    { text: '⏱️ 1h', callback_data: 'antilink_dur_3600' },
                    { text: '⏱️ 24h', callback_data: 'antilink_dur_86400' }
                ]] : [])
            ]
        }
    };

    if (ctx.callbackQuery) {
        await ctx.editMessageText(text, keyboard).catch(() => ctx.reply(text, keyboard));
    } else {
        await ctx.reply(text, { 
            ...keyboard, 
            reply_to_message_id: ctx.message?.message_id 
        });
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
            const config = getConfig(ctx.chat.id);
            config.enabled = (action === 'on');

            await ctx.answerCbQuery(config.enabled ? "AntiLink enabled!" : "AntiLink disabled!");
            await handleAntiLinkConfig(ctx);
        } catch (err) {
            console.error("[ANTILINK ACTION ERROR]:", err);
            await ctx.answerCbQuery("An error occurred.", { show_alert: true });
        }
    });

    // Handling Mode Change (delete / restrict)
    bot.action(/^antilink_mode_(delete|restrict)$/, async (ctx) => {
        try {
            if (!(await checkAdmin(ctx))) {
                return await ctx.answerCbQuery("⚠️ Action restricted to administrators!", { show_alert: true });
            }

            const newMode = ctx.match[1];
            const config = getConfig(ctx.chat.id);
            config.mode = newMode;

            await ctx.answerCbQuery(`Mode set to ${newMode}!`);
            await handleAntiLinkConfig(ctx);
        } catch (err) {
            console.error("[ANTILINK MODE ERROR]:", err);
            await ctx.answerCbQuery("An error occurred.", { show_alert: true });
        }
    });

    // Handling Duration Change for Restriction
    bot.action(/^antilink_dur_(\d+)$/, async (ctx) => {
        try {
            if (!(await checkAdmin(ctx))) {
                return await ctx.answerCbQuery("⚠️ Action restricted to administrators!", { show_alert: true });
            }

            const duration = parseInt(ctx.match[1], 10);
            const config = getConfig(ctx.chat.id);
            config.duration = duration;

            const mins = Math.round(duration / 60);
            const timeLabel = mins >= 60 ? `${mins / 60}h` : `${mins}m`;

            await ctx.answerCbQuery(`Duration set to ${timeLabel}!`);
            await handleAntiLinkConfig(ctx);
        } catch (err) {
            console.error("[ANTILINK DURATION ERROR]:", err);
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
            const config = getConfig(chatId);
            if (!config.enabled) {
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
                    if (ctx.sender_chat || (ctx.from && ctx.from.id === 1087968824)) {
                        return next();
                    }
                    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
                    if (['creator', 'administrator'].includes(member.status)) {
                        return next();
                    }
                } catch (err) {
                    console.error("[ANTILINK] Error verifying admin:", err);
                    return next();
                }

                // Delete the message containing the link
                await ctx.deleteMessage().catch(() => {});
                
                const userId = ctx.from?.id;
                const firstName = ctx.from?.first_name || 'Utilisateur';
                const userMention = userId ? `<a href="tg://user?id=${userId}">${firstName}</a>` : firstName;

                // Restrict the user if the mode is set to 'restrict'
                if (config.mode === 'restrict' && userId) {
                    try {
                        const untilDate = Math.floor(Date.now() / 1000) + config.duration;
                        await ctx.telegram.restrictChatMember(chatId, userId, {
                            permissions: {
                                can_send_messages: false,
                                can_send_media_messages: false,
                                can_send_other_messages: false,
                                can_add_web_page_previews: false
                            },
                            until_date: untilDate
                        });
                    } catch (restrictErr) {
                        console.error("[ANTILINK] Error restricting user:", restrictErr);
                    }
                }

                // Warning message formatting
                const actionDesc = config.mode === 'restrict' 
                    ? `links are not allowed here! You have been restricted for ${Math.round(config.duration / 60)} minute(s).` 
                    : `links are not allowed here!`;

                // Send persistent warning message with inline channel button
                await ctx.reply(`<blockquote>⚠️ ${userMention}, ${actionDesc}</blockquote>`, { 
                    parse_mode: 'HTML',
                    reply_to_message_id: ctx.message.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙰𝙽𝙰𝙻', url: 'https://t.me/kayatech2' }]
                        ]
                    }
                });
                
                return;
            }

            return next();
            
        } catch (err) {
            console.error("[ANTILINK ERROR]", err);
            return next();
        }
    });
}
