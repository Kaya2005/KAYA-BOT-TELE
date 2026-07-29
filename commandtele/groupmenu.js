// ==========================================
// FICHIER : commandtele/groupmenu.js
// ==========================================
export default function setupGroupMenu(bot) {
    bot.command('groupmenu', async (ctx) => {
        try {
            const now = new Date();
            const time = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Lubumbashi', hour: '2-digit', minute:'2-digit' });
            const date = now.toLocaleDateString('en-GB', { timeZone: 'Africa/Lubumbashi', day: '2-digit', month: '2-digit', year: 'numeric' });
            
            const groupMenuText = `<blockquote>▰▰▰▰▰▰▰▰▰▰
➠ Bot: <b>KAYA BOT (Group Mode)</b>
➠ Time: <b>${time}</b>
➠ Date: <b>${date}</b>
______________________

> ╢ GROUP & MODERATION ♰
╭▰▰▰▰▰▰▰◈
┆❏ /group 
┆❏ /groupmenu
┆❏ /welcome 
┆❏ /antilink 
╰▰▰▰▰▰▰▰◈</blockquote>`;

            const botUsername = ctx.botInfo?.username || 'KayaMdBot';

            await ctx.replyWithPhoto('https://files.catbox.moe/1ddhgm.jpg', {
                caption: groupMenuText,
                parse_mode: 'HTML',
                reply_to_message_id: ctx.message?.message_id,
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
            await ctx.reply('<blockquote>⚠️ An error occurred while generating the group menu.</blockquote>', { 
                parse_mode: 'HTML', 
                reply_to_message_id: ctx.message?.message_id 
            });
        }
    });
}
