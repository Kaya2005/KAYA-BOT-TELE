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
Appuie sur les boutons ci-dessous pour interagir et configurer les options du groupe ! 🚀</blockquote>`;

            const botUsername = ctx.botInfo?.username || 'KayaMdBot';

            await ctx.replyWithPhoto('https://files.catbox.moe/1ddhgm.jpg', {
                caption: groupMenuText,
                parse_mode: 'HTML',
                reply_to_message_id: ctx.message?.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '📋 /group', callback_data: 'cmd_group' },
                            { text: '🏠 /groupmenu', callback_data: 'cmd_groupmenu' }
                        ],
                        [
                            { text: '👋 /welcome', callback_data: 'menu_welcome' },
                            { text: '🛡️ /antilink', callback_data: 'menu_antilink' }
                        ],
                        [
                            { text: '🤖 /chatbot', callback_data: 'menu_chatbot' }
                        ],
                        [
                            { text: '➕ Add Bot to Group', url: `https://t.me/${botUsername}?startgroup=true` }
                        ]
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

    // Actions interactives pour les boutons du menu
    bot.action('cmd_group', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('<blockquote>📋 <b>Commande /group</b>\n\nPermet de voir les instructions rapides pour ajouter et configurer le bot dans ton groupe Telegram.</blockquote>', { parse_mode: 'HTML' });
    });

    bot.action('cmd_groupmenu', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('<blockquote>🏠 <b>Commande /groupmenu</b>\n\nAffiche le panneau de contrôle interactif complet du groupe.</blockquote>', { parse_mode: 'HTML' });
    });

    bot.action('menu_chatbot', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('<blockquote>🤖 <b>Configuration du Chatbot IA (Ado)</b>\n\nPour l\'activer ou le désactiver dans ton groupe, tape :\n• <code>/chatbot on</code>\n• <code>/chatbot off</code>\n\nUne fois activé, mentionne le bot ou réponds à l\'un de ses messages pour discuter naturellement avec lui !</blockquote>', { parse_mode: 'HTML' });
    });
}
