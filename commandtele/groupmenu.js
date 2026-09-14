// ==========================================
// FICHIER : commandtele/groupmenu.js (Optimisé & Bilingue)
// ==========================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const langFilePath = path.join(__dirname, '../database/languages.json');

function getLang(chatId) {
    try {
        if (fs.existsSync(langFilePath)) {
            const data = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
            return data[String(chatId)] || 'en';
        }
    } catch (e) {}
    return 'en';
}

function setLang(chatId, lang) {
    try {
        let data = {};
        if (fs.existsSync(langFilePath)) {
            data = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
        }
        data[String(chatId)] = lang;
        fs.writeFileSync(langFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {}
}

export default function setupGroupMenu(bot) {
    bot.command('groupmenu', async (ctx) => {
        try {
            const chatId = ctx.chat.id;
            const lng = getLang(chatId);
            const now = new Date();
            const time = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Lubumbashi', hour: '2-digit', minute:'2-digit' });
            
            const userName = ctx.from?.first_name || "toi";
            const mention = ctx.from?.id ? `<a href="tg://user?id=${ctx.from.id}">${userName}</a>` : userName;

            const text = lng === 'fr' 
                ? `<blockquote>⚡ <b>KAYA BOT • Menu</b>\n⏱️ ${time} | 👤 ${mention}\n\n⚙️ Configure ton groupe ci-dessous :</blockquote>`
                : `<blockquote>⚡ <b>KAYA BOT • Menu</b>\n⏱️ ${time} | 👤 ${mention}\n\n⚙️ Configure your group below:</blockquote>`;

            const botUsername = ctx.botInfo?.username || 'KayaMdBot';

            await ctx.replyWithPhoto('https://files.catbox.moe/1ddhgm.jpg', {
                caption: text,
                parse_mode: 'HTML',
                reply_to_message_id: ctx.message?.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '👋 Welcome', callback_data: 'menu_welcome' },
                            { text: '🛡️ AntiLink', callback_data: 'menu_antilink' }
                        ],
                        [
                            { text: '🤖 Chatbot IA', callback_data: 'menu_chatbot' },
                            { text: lng === 'fr' ? '🌐 Langue (FR/EN)' : '🌐 Language (FR/EN)', callback_data: 'menu_lang_panel' }
                        ],
                        [
                            { text: lng === 'fr' ? '➕ Ajouter au groupe' : '➕ Add to Group', url: `https://t.me/${botUsername}?startgroup=true` }
                        ]
                    ]
                }
            });
        } catch (err) {
            await ctx.reply('<blockquote>⚠️ Error.</blockquote>', { parse_mode: 'HTML' });
        }
    });

    // Panel de changement de langue rapide depuis le menu
    bot.action('menu_lang_panel', async (ctx) => {
        await ctx.answerCbQuery();
        const chatId = ctx.chat.id;
        const lng = getLang(chatId);

        const text = lng === 'fr'
            ? "🌐 <b>Choisis la langue du groupe :</b>"
            : "🌐 <b>Choose group language:</b>";

        await ctx.editMessageCaption(text, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🇫🇷 Français', callback_data: 'setlang_group_fr' },
                        { text: '🇬🇧 English', callback_data: 'setlang_group_en' }
                    ],
                    [
                        { text: lng === 'fr' ? '⬅️ Retour' : '⬅️ Back', callback_data: 'menu_back_main' }
                    ]
                ]
            }
        }).catch(() => {});
    });

    bot.action(/^setlang_group_(fr|en)$/, async (ctx) => {
        const lang = ctx.match[1];
        const chatId = ctx.chat.id;
        setLang(chatId, lang);

        const msg = lang === 'fr' ? "✅ Langue définie sur Français 🇫🇷" : "✅ Language set to English 🇬🇧";
        await ctx.answerCbQuery(msg);
        
        // Relancer le menu principal après changement
        ctx.message = { message_id: ctx.callbackQuery.message.message_id };
        // Simule un retour ou actualise
        const now = new Date();
        const time = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Lubumbashi', hour: '2-digit', minute:'2-digit' });
        const text = lang === 'fr' 
            ? `<blockquote>⚡ <b>KAYA BOT • Menu</b>\n⏱️ ${time}\n\n⚙️ Configure ton groupe ci-dessous :</blockquote>`
            : `<blockquote>⚡ <b>KAYA BOT • Menu</b>\n⏱️ ${time}\n\n⚙️ Configure your group below:</blockquote>`;

        const botUsername = ctx.botInfo?.username || 'KayaMdBot';
        await ctx.editMessageCaption(text, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '👋 Welcome', callback_data: 'menu_welcome' },
                        { text: '🛡️ AntiLink', callback_data: 'menu_antilink' }
                    ],
                    [
                        { text: '🤖 Chatbot IA', callback_data: 'menu_chatbot' },
                        { text: lang === 'fr' ? '🌐 Langue (FR/EN)' : '🌐 Language (FR/EN)', callback_data: 'menu_lang_panel' }
                    ],
                    [
                        { text: lang === 'fr' ? '➕ Ajouter au groupe' : '➕ Add to Group', url: `https://t.me/${botUsername}?startgroup=true` }
                    ]
                ]
            }
        }).catch(() => {});
    });

    bot.action('menu_chatbot', async (ctx) => {
        await ctx.answerCbQuery();
        const chatId = ctx.chat.id;
        const lng = getLang(chatId);
        
        const text = lng === 'fr'
            ? `<blockquote>🤖 <b>CHATBOT IA</b>\n\nActive ou désactive l'IA :</blockquote>`
            : `<blockquote>🤖 <b>AI CHATBOT</b>\n\nEnable or disable AI:</blockquote>`;

        await ctx.editMessageCaption(text, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ ON', callback_data: 'chatbot_on' },
                        { text: '❌ OFF', callback_data: 'chatbot_off' }
                    ]
                ]
            }
        }).catch(() => {});
    });
}
