// ==========================================
// FICHIER : bot.js (Intégration complète rétablie)
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
import setupLanguage, { getLang, setLang } from './commandtele/language.js';

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
    },
    fr: {
        welcome: "Bienvenue ! Choisissez une option ci-dessous pour connecter votre WhatsApp, ajouter le bot à votre groupe ou choisir votre langue.",
        btnStart: "🚀 Menu Principal (WhatsApp)",
        btnGroup: "➕ Ajouter le bot au groupe",
        btnLang: "🌐 Langue : Français 🇫🇷",
        selectLang: "Veuillez choisir votre langue préférée :",
        langChanged: "✅ Langue changée avec succès en Français 🇫🇷",
        adminOnly: "❌ Seuls les administrateurs du groupe peuvent modifier la langue du bot.",
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

const ensurePrivate = (ctx) => {
    if (isOwner(ctx)) return true;
    if (!ctx.chat || ctx.chat.type !== 'private') {
        const botUsername = ctx.botInfo?.username || 'KayaMdBot';
        ctx.reply('<blockquote>❌ Please write to me in private to use this command.</blockquote>', {
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💬 Open Bot in Private', url: `https://t.me/${botUsername}` }],
                    [{ text: '🔒 Groupe Privé', url: PRIVATE_GROUP_LINK }]
                ]
            }
        });
        return false;
    }
    return true;
};

const checkChannels = async (ctx) => {
    if (isOwner(ctx)) return true;

    for (const channel of REQUIRED_CHANNELS) {
        try {
            const member = await ctx.telegram.getChatMember(channel, ctx.from.id);
            if (['left', 'kicked'].includes(member.status)) return false;
        } catch { return false; }
    }
    return true;
};

const getActiveSessions = () => {
    if (!fs.existsSync(pairingFolder)) return [];
    return fs.readdirSync(pairingFolder, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(folderName => {
            const credsPath = path.join(pairingFolder, folderName, 'creds.json');
            return fs.existsSync(credsPath);
        });
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
setupLanguage(bot);

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
                    [{ text: '𝚉𝙾𝙽𝙴 〽️𝙲𝙷𝙰𝚃', url: PRIVATE_GROUP_LINK }],
                    [
                        { text: '🇫🇷 FR', callback_data: 'setlang_fr' },
                        { text: '🇬🇧 EN', callback_data: 'setlang_en' }
                    ]
                ]
            }
        });
    }
});

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
                [{ text: '𝚉𝙾𝙽𝙴 〽️𝙲𝙷𝙰𝚃', url: PRIVATE_GROUP_LINK }]
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
    ctx.reply('<blockquote>▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\n✅ <b>Status:</b> Online / En ligne</blockquote>', { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id,
        reply_markup: {
            inline_keyboard: [
                [{ text: '𝚉𝙾𝙽𝙴 〽️𝙲𝙷𝙰𝚃', url: PRIVATE_GROUP_LINK }]
            ]
        }
    });
});

bot.command('connect', async (ctx) => {
    if (!ensurePrivate(ctx)) return;

    const activeSessions = getActiveSessions();
    if (activeSessions.length >= 60) {
        return ctx.reply('<blockquote>❌ <b>Error:</b> Server capacity reached (60/60). Please try again later.</blockquote>', { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    if (!(await checkChannels(ctx))) {
        return ctx.reply('<blockquote>⚠️ Restricted access. Please join our channels to continue:</blockquote>', {
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙷𝙰𝚃', url: 'https://t.me/+nctwjD43hDk0ODBk' }],
                    [{ text: '𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙰𝙽𝙰𝙻', url: 'https://t.me/kayatech2' }],
                    [{ text: '𝙎𝙊𝙐𝙇 𝙎𝙊𝘾𝙄𝙀𝙏𝙔🪶', url: 'https://t.me/society243' }],
                    [{ text: '✅ I Have Joined', callback_data: 'check_join' }]
                ]
            }
        });
    }

    const text = ctx.message.text.split(' ')[1];
    if (!text) return ctx.reply('<blockquote>⚠️ Usage: <code>/connect 243xxxxxx</code></blockquote>', { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id 
    });
    
    const number = text.replace(/\D/g, '');
    if (number.length < 9) return ctx.reply('<blockquote>❌ Invalid number. Minimum 9 digits required.</blockquote>', { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id 
    });
    
    const jid = number + "@s.whatsapp.net";
    const teleId = ctx.from.id;
    const userName = ctx.from.first_name || "Unknown";
    
    const requestPath = path.join(pairingFolder, `request_${teleId}.json`);
    fs.writeFileSync(requestPath, JSON.stringify({ jid, name: userName }));
    
    ctx.reply('<blockquote>⏳ Initialization... please wait.</blockquote>', { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id 
    });
    
    let attempts = 0;
    let cuObj = null;
    const pairingFile = path.join(pairingFolder, `pairing_${teleId}.json`);

    while (attempts < 20) {
        if (fs.existsSync(pairingFile)) {
            try {
                cuObj = JSON.parse(fs.readFileSync(pairingFile, 'utf-8'));
                break;
            } catch (e) { }
        }
        await new Promise(r => setTimeout(r, 1000));
        attempts++;
    }
    
    if (cuObj) {
        const pairingStyle = `<blockquote>▰▰▰▰▰▰▰▰▰▰\n> ╢ PAIRING CODE ♰\n╭▰▰▰▰▰▰▰◈\n┆🔑 Code: <code>${cuObj.code}</code>\n╰▰▰▰▰▰▰▰◈</blockquote>`;
        ctx.reply(pairingStyle, { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '𝚉𝙾𝙽𝙴 〽️𝙲𝙷𝙰𝚃', url: PRIVATE_GROUP_LINK }]
                ]
            }
        });
    } else {
        ctx.reply('<blockquote>❌ Error: Pairing code could not be generated.</blockquote>', { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id 
        });
    }
});

bot.action('check_join', async (ctx) => {
    if (await checkChannels(ctx)) {
        await ctx.editMessageText('✅ You can connect now.');
        ctx.answerCbQuery('✅ Access authorized.');
    } else {
        ctx.answerCbQuery('❌ You must join the required channels first.', { show_alert: true });
    }
});

bot.command('listpair', async (ctx) => {
    if (!isOwner(ctx)) return;
    if (!ensurePrivate(ctx)) return;

    const activeSessions = getActiveSessions();
    if (activeSessions.length === 0) return ctx.reply('<blockquote>No devices linked.</blockquote>', { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id 
    });

    let text = `<blockquote>> ╢ CONNECTED : ${activeSessions.length}/60 ♰\n`;
    
    activeSessions.forEach((number, i) => {
        let userName = "Unknown";
        let teleId = "N/A";
        
        try {
            const metaPath = path.join(pairingFolder, number, 'metadata.json');
            if (fs.existsSync(metaPath)) {
                const data = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
                userName = data.userName || "Unknown";
                teleId = data.teleId || "N/A";
            }
        } catch (e) {}

        text += `┆❏ ${i + 1}. <b>${userName}</b> (${number}) [TeleID: ${teleId}]\n`;
    });
    
    text += `</blockquote>`;
    ctx.reply(text, { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id 
    });
});

bot.command('delpair', async (ctx) => {
    if (!isOwner(ctx)) return; 
    if (!ensurePrivate(ctx)) return;

    const arg = ctx.message.text.split(' ')[1];
    if (!arg) return ctx.reply('<blockquote>⚠️ Usage: <code>/delpair [teleId or number]</code></blockquote>', { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id 
    });
    
    let teleId = arg.replace(/\D/g, '');
    let foundNumber = null;

    const activeSessions = getActiveSessions();
    for (const number of activeSessions) {
        try {
            const metaPath = path.join(pairingFolder, number, 'metadata.json');
            if (fs.existsSync(metaPath)) {
                const data = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
                if (String(data.teleId) === teleId || number === teleId) {
                    foundNumber = number;
                    teleId = String(data.teleId || teleId);
                    break;
                }
            }
        } catch (e) {}
    }

    if (foundNumber) {
        forceCleanupSession(foundNumber, teleId);
        return ctx.reply(`<blockquote>✅ Session for <code>${foundNumber}</code> disconnected successfully.</blockquote>`, { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    if (fs.existsSync(path.join(pairingFolder, teleId))) {
        forceCleanupSession(teleId, "default");
        return ctx.reply(`<blockquote>✅ Session <code>${teleId}</code> disconnected successfully.</blockquote>`, { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    ctx.reply('<blockquote>❌ Session not found.</blockquote>', { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id 
    });
});

bot.command('broadcast', async (ctx) => {
    if (!isOwner(ctx)) return;
    if (!ensurePrivate(ctx)) return;

    const messageText = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageText) {
        return ctx.reply('<blockquote>⚠️ Usage: <code>/broadcast Votre message ici...</code></blockquote>', { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    let targetIds = [];
    try {
        if (fs.existsSync(usersFilePath)) {
            targetIds = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
        }
    } catch (e) {}

    if (targetIds.length === 0) {
        return ctx.reply('<blockquote>❌ Aucun utilisateur enregistré pour le moment.</blockquote>', { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    await ctx.reply(`<blockquote>⏳ Diffusion en cours vers <b>${targetIds.length}</b> utilisateur(s)...</blockquote>`, { 
        parse_mode: 'HTML' 
    });

    let successCount = 0;
    let failCount = 0;

    for (const teleId of targetIds) {
        try {
            await bot.telegram.sendMessage(
                teleId, 
                `<blockquote>📢 <b>ANNONCE - KAYA BOT</b>\n\n${messageText}</blockquote>`, 
                { parse_mode: 'HTML' }
            );
            successCount++;
        } catch (error) {
            failCount++;
        }
        await new Promise(r => setTimeout(r, 50)); 
    }

    await ctx.reply(
        `<blockquote>✅ <b>Diffusion terminée !</b>\n\n` +
        `📤 Envoyés avec succès : <b>${successCount}</b>\n` +
        `❌ Échecs (utilisateurs ayant bloqué le bot) : <b>${failCount}</b></blockquote>`, 
        { parse_mode: 'HTML' }
    );
});

bot.launch().then(() => console.log('▉ KAYA BOT is online with active token & full commands.'));
