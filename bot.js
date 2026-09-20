// ==========================================
// FICHIER : bot.js (Mise à jour : Suppression Zone Chat, réduction description & /connect -> pair)
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

// ================= DICTIONNAIRE DE LANGUES =================
const langData = {
    en: {
        welcome: "Welcome! Connect your WhatsApp or add the bot to your group.",
        btnStart: "🚀 Start Menu (WhatsApp)",
        btnGroup: "➕ Add Bot to Group",
        btnLang: "🌐 Language: English 🇬🇧",
        selectLang: "Please select your preferred language:",
        langChanged: "✅ Language successfully changed to English 🇬🇧",
        adminOnly: "❌ Only group administrators can change the bot's language.",
    },
    fr: {
        welcome: "Bienvenue ! Connectez votre WhatsApp ou ajoutez le bot à votre groupe.",
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
                    [{ text: '💬 Open Bot in Private', url: `https://t.me/${botUsername}` }]
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
    
    let menu = `<blockquote>
 ▰▰▰▰▰▰▰▰▰
➠ User   : <b>${userName}</b>
➠ Lang   : <b>${lng.toUpperCase()}</b>
➠ Time   : <b>${time}</b>
➠ Date   : <b>${date}</b>
______________________
𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 𝙲𝙾𝙽𝙽𝙴𝙲𝚃
╭▰▰▰▰▰▰▰◈
┆❏ /pair
┆❏ /ping
╰▰▰▰▰▰▰▰◈
𝚃𝙴𝙻𝙴𝙶𝚁𝙰𝙼 𝙶𝚁𝙾𝚄𝙿𝚂
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
    
    ctx.userMention = () => {
        const userId = ctx.from?.id;
        const userName = ctx.from?.first_name || "User";
        return userId ? `<a href="tg://user?id=${userId}">${userName}</a>` : userName;
    };

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
        reply_markup: { inline_keyboard: [] }
    }).catch(async () => {
        await ctx.reply(getMenu(ctx.from.first_name, isOwner(ctx), chatId), { 
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [] }
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
                [{ text: '➕ Add to my Group', url: `https://t.me/${botUsername}?startgroup=true` }]
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
    const mention = ctx.userMention();
    ctx.reply(`<blockquote>▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\n👤 User : ${mention}\n✅ <b>Status:</b> Online / En ligne</blockquote>`, { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id
    });
});

bot.command('pair', async (ctx) => {
    if (!ensurePrivate(ctx)) return;

    const mention = ctx.userMention();
    const activeSessions = getActiveSessions();
    if (activeSessions.length >= 60) {
        return ctx.reply(`<blockquote>❌ ${mention}, <b>Error:</b> Server capacity reached (60/60). Please try again later.</blockquote>`, { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    if (!(await checkChannels(ctx))) {
        return ctx.reply(`<blockquote>⚠️ ${mention}, restricted access. Please join our channels to continue:</blockquote>`, {
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙷𝙰𝚃', url: 'https://t.me/+nctwjD43hDk0ODBk' }],
                    [{ text: '𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙰𝙽𝙰𝙻', url: 'https://t.me/kayatech2' }],
                    [{ text: '𝙎1𝙊𝙐𝙇 𝙎0𝘾𝙄𝙀𝙏𝙔🪶', url: 'https://t.me/society243' }],
                    [{ text: '✅ I Have Joined', callback_data: 'check_join' }]
                ]
            }
        });
    }

    const text = ctx.message.text.split(' ')[1];
    if (!text) return ctx.reply(`<blockquote>⚠️ ${mention}, Usage: <code>/pair 243xxxxxx</code></blockquote>`, { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id 
    });
    
    const number = text.replace(/\D/g, '');
    if (number.length < 9) return ctx.reply(`<blockquote>❌ ${mention}, Invalid number. Minimum 9 digits required.</blockquote>`, { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id 
    });
    
    const jid = number + "@s.whatsapp.net";
    const teleId = ctx.from.id;
    const userName = ctx.from.first_name || "Unknown";
    
    const requestPath = path.join(pairingFolder, `request_${teleId}.json`);
    fs.writeFileSync(requestPath, JSON.stringify({ jid, name: userName }));
    
    ctx.reply(`<blockquote>⏳ ${mention}, Initialization... please wait.</blockquote>`, { 
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
        const pairingStyle = `<blockquote>▰▰▰▰▰▰▰▰▰▰\n> ╢ PAIRING CODE ♰\n👤 User: ${mention}\n╭▰▰▰▰▰▰▰◈\n┆🔑 Code: <code>${cuObj.code}</code>\n╰▰▰▰▰▰▰▰◈</blockquote>`;
        ctx.reply(pairingStyle, { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id
        });
    } else {
        ctx.reply(`<blockquote>❌ ${mention}, Error: Pairing code could not be generated.</blockquote>`, { 
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

    const mention = ctx.userMention();
    const activeSessions = getActiveSessions();
    if (activeSessions.length === 0) return ctx.reply(`<blockquote>${mention}, No devices linked.</blockquote>`, { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id 
    });

    let text = `<blockquote>👤 User : ${mention}\n> ╢ CONNECTED : ${activeSessions.length}/60 ♰\n`;
    
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

    const mention = ctx.userMention();
    const arg = ctx.message.text.split(' ')[1];
    if (!arg) return ctx.reply(`<blockquote>⚠️ ${mention}, Usage: <code>/delpair [teleId or number]</code></blockquote>`, { 
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
        return ctx.reply(`<blockquote>✅ ${mention}, Session for <code>${foundNumber}</code> disconnected successfully.</blockquote>`, { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    if (fs.existsSync(path.join(pairingFolder, teleId))) {
        forceCleanupSession(teleId, "default");
        return ctx.reply(`<blockquote>✅ ${mention}, Session <code>${teleId}</code> disconnected successfully.</blockquote>`, { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    ctx.reply(`<blockquote>❌ ${mention}, Session not found.</blockquote>`, { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id 
    });
});

bot.command('broadcast', async (ctx) => {
    if (!isOwner(ctx)) return;
    if (!ensurePrivate(ctx)) return;

    const mention = ctx.userMention();
    const messageText = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageText) {
        return ctx.reply(`<blockquote>⚠️ ${mention}, Usage: <code>/broadcast Votre message ici...</code></blockquote>`, { 
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
        return ctx.reply(`<blockquote>❌ ${mention}, Aucun utilisateur enregistré pour le moment.</blockquote>`, { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    await ctx.reply(`<blockquote>⏳ ${mention}, Diffusion en cours vers <b>${targetIds.length}</b> utilisateur(s)...</blockquote>`, { 
        parse_mode: 'HTML' 
    });

    let successCount = 0;
    let failCount = 0;

    for (const teleId of targetIds) {
        try {
            await bot.telegram.sendMessage(
                teleId, 
                `<blockquote>📢 <b>ANNONCE - KAYA BOT</b>\n\n${messageTest}</blockquote>`, 
                { parse_mode: 'HTML' }
            );
            successCount++;
        } catch (error) {
            failCount++;
        }
        await new Promise(r => setTimeout(r, 50)); 
    }

    await ctx.reply(
        `<blockquote>✅ ${mention}, <b>Diffusion terminée !</b>\n\n` +
        `📤 Envoyés avec succès : <b>${successCount}</b>\n` +
        `❌ Échecs (utilisateurs ayant bloqué le bot) : <b>${failCount}</b></blockquote>`, 
        { parse_mode: 'HTML' }
    );
});

bot.launch().then(() => console.log('▉ KAYA BOT is online with active token & full commands.'));
