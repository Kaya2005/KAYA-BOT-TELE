// ==========================================
// FICHIER : bot.js
// ==========================================
import './config.js'; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Telegraf } from 'telegraf';
import { forceCleanupSession } from './pair.js'; 
import { getActiveToken } from './token.js';

// Importation des commandes et modules Telegram
import setupWelcome from './commandtele/welcome.js';
import setupAntiLink from './commandtele/antilink.js';
import setupGroupMenu from './commandtele/groupmenu.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ================= CONSTANTS & PATHS =================
const adminFilePath = path.join(__dirname, './database/admintele.json');
const pairingFolder = path.join(__dirname, './richstore/pairing');
const REQUIRED_CHANNELS = ['-1004453499318', '@kayatech2'];

// ================= HELPERS =================
const isOwner = (ctx) => {
    try {
        const admins = JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
        return admins.includes(String(ctx.from.id));
    } catch { return false; }
};

// 🔒 Vérifie si le chat est privé (uniquement pour les commandes sensibles comme /connect)
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

// 🛠️ Fonction utilitaire pour récupérer toutes les vraies sessions WhatsApp actives
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

const getMenu = (userName, isAdmin) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Lubumbashi', hour: '2-digit', minute:'2-digit' });
    const date = now.toLocaleDateString('en-GB', { timeZone: 'Africa/Lubumbashi', day: '2-digit', month: '2-digit', year: 'numeric' });
    
    let menu = `<blockquote>▰▰▰▰▰▰▰▰▰▰
➠ User   : <b>${userName}</b>
➠ Prefix : <b>[ / ]</b>
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
        menu += `\n\n> ╢ OWNER PANEL ♰\n╭▰▰▰▰▰▰▰◈\n┆❏ /listpair\n┆❏ /delpair\n╰▰▰▰▰▰▰▰◈`;
    }
    menu += `</blockquote>`;
    return menu;
};

// 🚀 Utilisation de getActiveToken() pour récupérer dynamiquement le token valide et non utilisé depuis token.js
const bot = new Telegraf(getActiveToken());

// ================= CHARGEMENT DES MODULES TELEGRAM =================
setupWelcome(bot);
setupAntiLink(bot);
setupGroupMenu(bot);

// ================= COMMANDES =================
// /start fonctionne partout (groupes et privé)
bot.start(async (ctx) => {
    // Si c'est en privé, on affiche la photo et le menu complet
    if (ctx.chat.type === 'private') {
        await ctx.replyWithPhoto('https://files.catbox.moe/cctme5.jpg', {
            caption: '<blockquote>▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\nWelcome! Choose an option below to connect your WhatsApp or add the bot to your group.</blockquote>',
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: { 
                inline_keyboard: [
                    [{ text: '🚀 Start Menu (WhatsApp)', callback_data: 'start_bot' }],
                    [{ text: '➕ Add Bot to Group', callback_data: 'info_group' }]
                ] 
            }
        });
    } else {
        // Si c'est dans un groupe, on affiche l'image avec le menu complet en légende
        await ctx.replyWithPhoto('https://files.catbox.moe/1ddhgm.jpg', {
            caption: getMenu(ctx.from.first_name, isOwner(ctx)),
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message?.message_id
        });
    }
});


bot.action('start_bot', async (ctx) => {
    await ctx.editMessageCaption(getMenu(ctx.from.first_name, isOwner(ctx)), { parse_mode: 'HTML' }).catch(async () => {
        await ctx.reply(getMenu(ctx.from.first_name, isOwner(ctx)), { parse_mode: 'HTML' });
    });
});

bot.action('info_group', async (ctx) => {
    const text = `<blockquote>🤖 <b>TELEGRAM GROUP SETUP</b>\n\n` +
                 `To use moderation commands (Anti-link, Welcome) in your group:\n\n` +
                 `1️⃣ Click the button below to add the bot.\n` +
                 `2️⃣ Promote the bot as <b>Admin</b> with delete message rights.\n` +
                 `3️⃣ Use <code>/groupmenu</code> inside the group to see all options!</blockquote>`;

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

// /group fonctionne partout
bot.command('group', async (ctx) => {
    const text = `<blockquote>🤖 <b>TELEGRAM GROUP SETUP</b>\n\n` +
                 `To enable moderation and welcome features in your group:\n\n` +
                 `1. Add the bot to your group.\n` +
                 `2. Make the bot an <b>Administrator</b>.\n` +
                 `3. Send <code>/groupmenu</code> to view features.\n\n` +
                 `Click below to add it directly:</blockquote>`;

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

// /ping fonctionne partout
bot.command('ping', async (ctx) => {
    ctx.reply('<blockquote>▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\n✅ <b>Status:</b> Online</blockquote>', { 
        parse_mode: 'HTML',
        reply_to_message_id: ctx.message?.message_id 
    });
});

// /connect est STRICTEMENT réservé aux messages privés (DM)
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
                    [{ text: '𝚉𝙾𝙽𝙴 〽️𝙲𝙷𝙰𝚃', url: 'https://t.me/+nctwjD43hDk0ODBk' }],
                    [{ text: '𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙰𝙽𝙰𝙻', url: 'https://t.me/kayatech2' }],
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
            reply_to_message_id: ctx.message?.message_id 
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

bot.launch().then(() => console.log('▉ KAYA BOT is online with active token.'));
