// ==========================================
// FILE : commandtele/welcome.js
// ==========================================

const welcomeStates = new Map();

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
        console.error("[WELCOME] Admin check error:", err);
        return false;
    }
}

// Shared function to display the configuration panel
async function handleWelcomeConfig(ctx) {
    if (!ctx.chat || !['supergroup', 'group'].includes(ctx.chat.type)) {
        return ctx.reply("<blockquote>This command can only be used in a group.</blockquote>", { 
            parse_mode: 'HTML', 
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    if (!(await checkAdmin(ctx))) {
        return ctx.reply("<blockquote>⚠️ Only administrators can configure the welcome module.</blockquote>", { 
            parse_mode: 'HTML', 
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    const chatId = ctx.chat.id;
    const currentState = welcomeStates.get(chatId) ?? true;
    const statusText = currentState ? "🟢 Enabled (ON)" : "🔴 Disabled (OFF)";

    const text = `<blockquote>⚙️ <b>Welcome Module Management</b>\n\nCurrent Status: ${statusText}\n\nChoose an option:</blockquote>`;
    const keyboard = {
        parse_mode: 'HTML',
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
        await ctx.reply(text, { 
            ...keyboard, 
            reply_to_message_id: ctx.message?.message_id 
        });
    }
}

export default function setupWelcome(bot) {
    // Triggered by command (/welcome) and plain text (welcome)
    bot.command('welcome', handleWelcomeConfig);
    bot.hears(/^welcome$/i, handleWelcomeConfig);

    // Triggered via groupmenu button
    bot.action('menu_welcome', async (ctx) => {
        await ctx.answerCbQuery();
        await handleWelcomeConfig(ctx);
    });

    // Handling ON / OFF clicks
    bot.action(/^welcome_(on|off)$/, async (ctx) => {
        try {
            if (!(await checkAdmin(ctx))) {
                return await ctx.answerCbQuery("⚠️ Action restricted to administrators!", { show_alert: true });
            }

            const action = ctx.match[1];
            const chatId = ctx.chat.id;
            const newState = action === 'on';

            welcomeStates.set(chatId, newState);

            const statusText = newState ? "<blockquote>🟢 The Welcome module has been <b>ENABLED</b>.</blockquote>" : "<blockquote>🔴 The Welcome module has been <b>DISABLED</b>.</blockquote>";

            await ctx.answerCbQuery(newState ? "Welcome enabled!" : "Welcome disabled!");
            await ctx.editMessageText(statusText, {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [] }
            });
        } catch (err) {
            console.error("[WELCOME ACTION ERROR]:", err);
            await ctx.answerCbQuery("An error occurred.", { show_alert: true });
        }
    });

    // Sending welcome message to new members
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
                const username = member.username ? `@${member.username}` : 'None';
                const id = member.id;

                const now = new Date();
                const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                const date = now.toLocaleDateString('en-GB');

                const welcomeText = `<blockquote>▰▰▰▰▰▰▰▰▰▰
➠ ᴜsᴇʀ : ${fullName}
➠ ᴛɪᴍᴇ : ${time}
➠ ᴅᴀᴛᴇ : ${date}

    🇼​🇪​🇱​🇨​🇴​🇲​🇪​ 
╭▰▰▰▰▰▰▰◈
┆❏ 🙋 ᴜsᴇʀɴᴀᴍᴇ : ${username}
┆❏ 🆔 ɪᴅ : ${id}
╰▰▰▰▰▰▰▰◈</blockquote>`;

                const options = {
                    parse_mode: 'HTML',
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
                    console.error("Failed to retrieve profile picture:", e);
                }

                if (photoFileId) {
                    await ctx.replyWithPhoto(photoFileId, { 
                        caption: welcomeText,
                        ...options 
                    });
                } else {
                    await ctx.reply(welcomeText, options);
                }
            }
            
            return next();
        } catch (err) {
            console.error("[WELCOME ERROR CRITICAL]:", err);
            return next();
        }
    });
}
