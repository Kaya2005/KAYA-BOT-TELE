import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFolder = path.join(__dirname, '../database');
const langFilePath = path.join(dbFolder, 'languages.json');
const adminFilePath = path.join(dbFolder, 'admintele.json');

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

const isOwner = (ctx) => {
    try {
        if (!fs.existsSync(adminFilePath)) return false;
        const admins = JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
        return admins.includes(String(ctx.from.id));
    } catch { return false; }
};

const isAdminOrOwner = async (ctx, userId) => {
    try {
        if (isOwner(ctx)) return true;
        if (ctx.chat.type === 'private') return true;
        const member = await ctx.telegram.getChatMember(ctx.chat.id, userId);
        return ['creator', 'administrator'].includes(member.status);
    } catch {
        return false;
    }
};

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
        const userId = ctx.from.id;
        const isGroup = ['group', 'supergroup'].includes(ctx.chat.type);
        const currentLang = getLang(chatId);

        // Si c'est un groupe, vérifier si l'utilisateur est admin ou owner
        if (isGroup) {
            const authorized = await isAdminOrOwner(ctx, userId);
            if (!authorized) {
                const errorMsg = currentLang === 'fr'
                    ? "❌ Seuls les administrateurs du groupe peuvent modifier la langue du bot."
                    : "❌ Only group administrators can change the bot's language.";
                return await ctx.reply(`<blockquote>${errorMsg}</blockquote>`, { parse_mode: 'HTML', reply_to_message_id: ctx.message?.message_id });
            }
        }

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
                ? `<blockquote>🌐 <b>Gestion de la langue</b>\n\nUtilisez la commande avec votre choix :\n• <code>/langue fr</code> pour le Français\n• <code>/langue en</code> pour l'Anglais\n\nLangue actuelle : <b>${currentLang.toUpperCase()}</b></blockquote>`
                : `<blockquote>🌐 <b>Language Management</b>\n\nUse the command with your choice:\n• <code>/langue fr</code> for French\n• <code>/langue en</code> for English\n\nCurrent Language: <b>${currentLang.toUpperCase()}</b></blockquote>`;
            return await ctx.reply(usageText, { parse_mode: 'HTML', reply_to_message_id: ctx.message?.message_id });
        }

        setLang(chatId, choice);
        const successText = choice === 'fr'
            ? "<blockquote>✅ Langue du groupe changée avec succès en <b>Français 🇫🇷</b></blockquote>"
            : "<blockquote>✅ Group language successfully changed to <b>English 🇬🇧</b></blockquote>";

        await ctx.reply(successText, { parse_mode: 'HTML', reply_to_message_id: ctx.message?.message_id });
    };

    // Enregistrement des commandes
    bot.command(['langue', 'lang'], handleLangCommand);

    // Gestion des clics sur les boutons de langue (sécurité admin intégrée pour les groupes)
    bot.action(/^setlang_(fr|en)$/, async (ctx) => {
        try {
            const lang = ctx.match[1];
            const chatId = ctx.chat.id;
            const userId = ctx.from.id;
            const isGroup = ctx.chat.type !== 'private';

            if (isGroup) {
                const authorized = await isAdminOrOwner(ctx, userId);
                if (!authorized) {
                    const currentLang = getLang(chatId);
                    const alertMsg = currentLang === 'fr'
                        ? "❌ Seuls les administrateurs du groupe peuvent modifier la langue du bot."
                        : "❌ Only group administrators can change the bot's language.";
                    return await ctx.answerCbQuery(alertMsg, { show_alert: true });
                }
            }

            setLang(chatId, lang);
            const confirmation = lang === 'fr'
                ? "<blockquote>✅ Langue définie sur <b>Français 🇫🇷</b> avec succès !</blockquote>"
                : "<blockquote>✅ Language successfully set to <b>English 🇬🇧</b>!</blockquote>";

            await ctx.answerCbQuery(lang === 'fr' ? "✅ Français 🇫🇷" : "✅ English 🇬🇧");

            if (!isGroup) {
                await ctx.editMessageText(confirmation, {
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [] }
                }).catch(() => ctx.reply(confirmation, { parse_mode: 'HTML' }));
            } else {
                await ctx.reply(confirmation, { parse_mode: 'HTML' });
            }
        } catch (e) {}
    });
}
