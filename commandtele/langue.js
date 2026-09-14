// ==========================================
// FILE : commandtele/language.js
// ==========================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFolder = path.join(__dirname, '../database');
const langFilePath = path.join(dbFolder, 'languages.json');

if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

function loadLangs() {
    try {
        if (fs.existsSync(langFilePath)) {
            return JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
        }
    } catch (e) {}
    return {};
}

function saveLangs(data) {
    try {
        fs.writeFileSync(langFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {}
}

export function getLang(chatId) {
    const data = loadLangs();
    return data[String(chatId)] || 'en'; // Anglais par défaut
}

export function setLang(chatId, lang) {
    const data = loadLangs();
    data[String(chatId)] = lang;
    saveLangs(data);
}

export default function setupLanguage(bot) {
    const handleLangCommand = async (ctx) => {
        const chatId = ctx.chat.id;
        const isGroup = ['group', 'supergroup'].includes(ctx.chat.type);
        const currentLang = getLang(chatId);

        // Si c'est en PRIVÉ -> Boutons interactifs uniquement
        if (!isGroup) {
            const text = currentLang === 'fr'
                ? "🌐 <b>Sélection de la langue / Language Selection</b>\n\nChoisissez votre langue ci-dessous :"
                : "🌐 <b>Language Selection / Sélection de la langue</b>\n\nChoose your language below:";

            return await ctx.reply(text, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🇫🇷 Français', callback_data: 'setlang_fr' },
                            { text: '🇬🇧 English', callback_data: 'setlang_en' }
                        ]
                    ]
                }
            });
        }

        // Si c'est en GROUPE -> Commande texte (/langue fr ou /langue en)
        const args = ctx.message.text.split(' ').slice(1);
        const choice = args[0]?.toLowerCase();

        if (!['fr', 'en'].includes(choice)) {
            const usageText = currentLang === 'fr'
                ? "<blockquote>🌐 <b>Gestion de la langue</b>\n\nUtilisez la commande avec votre choix :\n• <code>/langue fr</code> pour le Français\n• <code>/langue en</code> pour l'Anglais\n\nLangue actuelle : <b>${currentLang.toUpperCase()}</b></blockquote>"
                : "<blockquote>🌐 <b>Language Management</b>\n\nUse the command with your choice:\n• <code>/langue fr</code> for French\n• <code>/langue en</code> for English\n\nCurrent Language: <b>${currentLang.toUpperCase()}</b></blockquote>";
            return await ctx.reply(usageText, { parse_mode: 'HTML' });
        }

        setLang(chatId, choice);
        const successText = choice === 'fr'
            ? "<blockquote>✅ Langue du groupe changée avec succès en <b>Français 🇫🇷</b></blockquote>"
            : "<blockquote>✅ Group language successfully changed to <b>English 🇬🇧</b></blockquote>";

        await ctx.reply(successText, { parse_mode: 'HTML' });
    };

    // Enregistrement des commandes
    bot.command(['langue', 'lang'], handleLangCommand);

    // Gestion des clics sur les boutons (uniquement en privé ou global)
    bot.action(/^setlang_(fr|en)$/, async (ctx) => {
        try {
            await ctx.answerCbQuery();
            const lang = ctx.match[1];
            const chatId = ctx.chat.id;

            setLang(chatId, lang);

            const confirmation = lang === 'fr'
                ? "<blockquote>✅ Langue définie sur <b>Français 🇫🇷</b> avec succès !</blockquote>"
                : "<blockquote>✅ Language successfully set to <b>English 🇬🇧</b>!</blockquote>";

            await ctx.editMessageText(confirmation, {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [] }
            }).catch(() => ctx.reply(confirmation, { parse_mode: 'HTML' }));
        } catch (e) {}
    });
}
