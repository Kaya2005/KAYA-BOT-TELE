// ==========================================
// FICHIER : commandtele/groupmenu.js
// ==========================================
export default function setupGroupMenu(bot) {
    bot.command('groupmenu', async (ctx) => {
        try {
            const now = new Date();
            const time = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Lubumbashi', hour: '2-digit', minute:'2-digit' });
            const date = now.toLocaleDateString('en-GB', { timeZone: 'Africa/Lubumbashi', day: '2-digit', month: '2-digit', year: 'numeric' });
            
            const groupMenuText = `▰▰▰▰▰▰▰▰▰▰
➠ Bot: *KAYA BOT (Group Mode)*
➠ Time: *${time}*
➠ Date: *${date}*
______________________

> ╢ GROUP & MODERATION ♰
╭▰▰▰▰▰▰▰◈
┆❏ /group 
┆❏ /groupmenu
┆❏ /welcome 
┆❏ /antilink 
╰▰▰▰▰▰▰▰◈`;

            const botUsername = ctx.botInfo?.username || 'KayaMdBot';

            await ctx.replyWithPhoto('https://files.catbox.moe/1ddhgm.jpg', {
                caption: groupMenuText,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '👋 Welcome Config', callback_data: 'menu_welcome' },
                            { text: '🛡️ AntiLink Config', callback_data: 'menu_antilink' }
                        ],
                        [{ text: '➕ Add Bot to Group', url: `https://t.me/${botUsername}?startgroup=true` }]
                    ]
                }
            });
        } catch (err) {
            console.error("[GROUPMENU ERROR]:", err);
            await ctx.reply('⚠️ An error occurred while generating the group menu.');
        }
    });
}
