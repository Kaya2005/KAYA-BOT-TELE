// ==========================================
// FICHIER : bot.js (Mis à jour avec setupLanguage)
// ==========================================
import './config.js'; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Telegraf } from 'telegraf';
import { forceCleanupSession } from './pair.js'; 
import { BOT_TOKEN } from './token.js';

import setupWelcome from './commandtele/welcome.js';
import setupAntiLink from './commandtele/antilink.js';
import setupGroupMenu from './commandtele/groupmenu.js';
import setupChatbot from './commandtele/chatbot.js';
import setupLanguage, { getLang, setLang } from './commandtele/langue.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ================= CONSTANTS & PATHS =================
const adminFilePath = path.join(__dirname, './database/admintele.json');
const usersFilePath = path.join(__dirname, './database/users.json');
const pairingFolder = path.join(__dirname, './richstore/pairing');
const REQUIRED_CHANNELS = ['-1004453499318', '@kayatech2', '@society243'];
const PRIVATE_GROUP_LINK = 'https://t.me/+WLdroZnDmstjMWNk';

// ================= DICTIONNAIRE DE LANGUES =================
const langData = {
    en: {
        welcome: "Welcome! Choose an option below to connect your WhatsApp, add the bot to your group, or select your language.",
        btnStart: "🚀 Start Menu (WhatsApp)",
        btnGroup: "➕ Add Bot to Group",
        btnLang: "🌐 Language: English 🇬🇧",
        selectLang: "Please select your preferred language:",
        langChanged: "✅ Language successfully changed to English 🇬🇧",
        adminOnly: "❌ Only group administrators can change the bot's language.",
        groupMenuTitle: "🤖 TELEGRAM GROUP SETUP",
    },
    fr: {
        welcome: "Bienvenue ! Choisissez une option ci-dessous pour connecter votre WhatsApp, ajouter le bot à votre groupe ou choisir votre langue.",
        btnStart: "🚀 Menu Principal (WhatsApp)",
        btnGroup: "➕ Ajouter le bot au groupe",
        btnLang: "🌐 Langue : Français 🇫🇷",
        selectLang: "Veuillez choisir votre langue préférée :",
        langChanged: "✅ Langue changée avec succès en Français 🇫🇷",
        adminOnly: "❌ Seuls les administrateurs du groupe peuvent modifier la langue du bot.",
        groupMenuTitle: "🤖 CONFIGURATION DU GROUPE TELEGRAM",
    }
};

// ================= HELPERS D'ADMINISTRATION =================
const isOwner = (ctx) => {
    try {
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

// ================= HELPERS EXISTANTS =================
const saveUser = (userId) => {
    try {
        let users = [];
        if (fs.existsSync(usersFilePath)) {
            users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
        }
        if (!users.includes(String(userId))) {
            users.push(String(userId));
            fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        }
    } catch (e) {}
};

const getMenu = (userName, isAdmin, chatId) => {
    const lng = getLang(chatId);
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Lubumbashi', hour: '2-digit', minute:'2-digit' });
    const date = now.toLocaleDateString('en-GB', { timeZone: 'Africa/Lubumbashi', day: '2-digit', month: '2-digit', year: 'numeric' });
    
    let menu = `<blockquote>▰▰▰▰▰▰▰▰▰▰
➠ User   : <b>${userName}</b>
➠ Lang   : <b>${lng.toUpperCase()}</b>
➠ Time   : <b>${time}</b>
➠ Date   : <b>${date}</b>
______________________

> ╢ WHATSAPP CONNECTION ♰
╭▰▰▰▰▰▰▰◈
┆❏ /connect
┆❏ /ping
╰▰▰▰▰▰▰▰◈

> ╢ TELEGRAM GROUPS ♰
╭▰▰▰▰▰▰▰◈
┆❏ /group
┆❏ /groupmenu
╰▰▰▰▰▰▰▰◈`;
    
    if (isAdmin) {
        menu += `\n\n> ╢ OWNER PANEL ♰\n╭▰▰▰▰▰▰▰◈\n┆❏ /listpair\n┆❏ /delpair\n┆❏ /broadcast\n╰▰▰▰▰▰▰▰◈`;
    }
    menu += `</blockquote>`;
    return menu;
};

// 🚀 Initialisation
const bot = new Telegraf(BOT_TOKEN);

bot.use((ctx, next) => {
    if (ctx.from) {
        saveUser(ctx.from.id);
    }
    return next();
});

setupWelcome(bot);
setupAntiLink(bot);
setupGroupMenu(bot);
setupChatbot(bot);
setupLanguage(bot); // Intégration du module de langue externe

// ================= COMMANDES =================
bot.start(async (ctx) => {
    const logoPath = path.join(__dirname, 'setting', 'logo.png');
    if (!fs.existsSync(logoPath)) {
        return ctx.reply("❌ Erreur : L'image logo.png est introuvable.");
    }

    const photo = { source: fs.readFileSync(logoPath) };
    const chatId = ctx.chat.id;
    const lng = getLang(chatId);
    const t = langData[lng] || langData['en'];

    if (ctx.chat.type === 'private') {
        await ctx.replyWithPhoto(photo, {
            caption: `<blockquote>▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\n${t.welcome}</blockquote>`,
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: { 
                inline_keyboard: [
                    [{ text: t.btnStart, callback_data: 'start_bot' }],
                    [{ text: '𝚉𝙾𝙽𝙴 〽️𝙲𝙷𝙰𝚃', url: PRIVATE_GROUP_LINK }],
                    [{ text: t.btnGroup, callback_data: 'info_group' }],
                    [
                        { text: '🇫🇷 Français', callback_data: 'setlang_fr' },
                        { text: '🇬🇧 English', callback_data: 'setlang_en' }
                    ]
                ] 
            }
        });
    } else {
        await ctx.replyWithPhoto(photo, {
            caption: getMenu(ctx.from.first_name, isOwner(ctx), chatId),
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔒 Groupe Privé', url: PRIVATE_GROUP_LINK }],
                    [
                        { text: '🇫🇷 FR', callback_data: 'setlang_fr' },
                        { text: '🇬🇧 EN', callback_data: 'setlang_en' }
                    ]
                ]
            }
        });
    }
});

// Gestion des actions de langue pour le menu de démarrage (compatible avec le module externe)
bot.action(/^setlang_(fr|en)$/, async (ctx) => {
    const selectedLang = ctx.match[1];
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;

    if (ctx.chat.type !== 'private') {
        const authorized = await isAdminOrOwner(ctx, userId);
        if (!authorized) {
            const lng = getLang(chatId);
            const t = langData[lng] || langData['en'];
            return ctx.answerCbQuery(t.adminOnly, { show_alert: true });
        }
    }

    setLang(chatId, selectedLang);
    const t = langData[selectedLang] || langData['en'];

    await ctx.answerCbQuery(t.langChanged);

    try {
        if (ctx.chat.type === 'private') {
            await ctx.editMessageCaption(`<blockquote>▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\n${t.welcome}</blockquote>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: t.btnStart, callback_data: 'start_bot' }],
                        [{ text: '𝚉𝙾𝙽𝙴 〽️𝙲𝙷𝙰𝚃', url: PRIVATE_GROUP_LINK }],
                        [{ text: t.btnGroup, callback_data: 'info_group' }],
                        [
                            { text: '🇫🇷 Français', callback_data: 'setlang_fr' },
                            { text: '🇬🇧 English', callback_data: 'setlang_en' }
                        ]
                    ]
                }
            });
        }
    } catch (e) {}
});

bot.action('start_bot', async (ctx) => {
    const chatId = ctx.chat.id;
    await ctx.editMessageCaption(getMenu(ctx.from.first_name, isOwner(ctx), chatId), { 
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔒 Rejoindre le Groupe Privé', url: PRIVATE_GROUP_LINK }]
            ]
        }
    }).catch(async () => {
        await ctx.reply(getMenu(ctx.from.first_name, isOwner(ctx), chatId), { 
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '𝚉𝙾𝙽𝙴 〽️𝙲𝙷𝙰𝚃', url: PRIVATE_GROUP_LINK }]
                ]
            }
        });
    });
});

bot.action('info_group', async (ctx) => {
    const chatId = ctx.chat.id;
    const lng = getLang(chatId);
    const text = lng === 'fr' 
        ? `<blockquote>🤖 <b>CONFIGURATION DU GROUPE TELEGRAM</b>\n\nPour utiliser les commandes de modération :\n1️⃣ Ajoutez le bot.\n2️⃣ Promouvez-le en tant qu'<b>Admin</b>.\n3️⃣ Utilisez <code>/groupmenu</code> !</blockquote>`
        : `<blockquote>🤖 <b>TELEGRAM GROUP SETUP</b>\n\nTo use moderation commands:\n1️⃣ Add the bot.\n2️⃣ Promote as <b>Admin</b>.\n3️⃣ Use <code>/groupmenu</code>!</blockquote>`;

    const botUsername = ctx.botInfo?.username || 'KayaMdBot';
    await ctx.reply(text, {
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id,
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Add to my Group', url: `https://t.me/${botUsername}?startgroup=true` }],
                [{ text: '𝚉𝙾𝙽𝙴 〽️𝙲𝙷𝙰𝚃', url: PRIVATE_GROUP_LINK }]
            ]
        }
    });
});

bot.command('group', async (ctx) => {
    const botUsername = ctx.botInfo?.username || 'KayaMdBot';
    await ctx.reply(`<blockquote>🤖 <b>TELEGRAM GROUP SETUP</b>\nUse <code>/groupmenu</code> inside your group after making the bot admin.</blockquote>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Add to my Group', url: `https://t.me/${botUsername}?startgroup=true` }]
            ]
        }
    });
});

bot.command('ping', async (ctx) => {
    ctx.reply('<blockquote>▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\n✅ <b>Status:</b> Online / En ligne</blockquote>', { parse_mode: 'HTML' });
});

bot.launch().then(() => console.log('▉ KAYA BOT is online with active token & multi-language support.'));
