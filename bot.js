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

// Importation des commandes Telegram depuis le dossier commandtele
import setupWelcome from './commandtele/welcome.js';
import setupAntiLink from './commandtele/antilink.js';

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

const checkChannels = async (ctx) => {
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
    
    let menu = `▰▰▰▰▰▰▰▰▰▰
➠ User: *${userName}*
➠ Prefix: *[ / ]*
➠ Time: *${time}*
➠ Date: *${date}*
______________________

> ╢ GENERAL ♰
╭▰▰▰▰▰▰▰◈
┆❏ /connect
┆❏ /ping
┆❏ /group
╰▰▰▰▰▰▰▰◈`;
    
    if (isAdmin) {
        menu += `\n\n> ╢ OWNER ♰\n╭▰▰▰▰▰▰▰◈\n┆❏ /listpair\n┆❏ /delpair\n╰▰▰▰▰▰▰▰◈`;
    }
    return menu;
};

// 🚀 Utilisation de getActiveToken() pour récupérer dynamiquement le premier token non utilisé
const bot = new Telegraf(getActiveToken());

// ================= CHARGEMENT DES MODULES TELEGRAM =================
setupWelcome(bot);
setupAntiLink(bot);

// ================= COMMANDS =================
bot.start(async (ctx) => {
    await ctx.replyWithPhoto('https://files.catbox.moe/1ddhgm.jpg', {
        caption: '▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\nWelcome! Choose an option below to connect your WhatsApp or add the bot to your group.',
        reply_markup: { 
            inline_keyboard: [
                [{ text: '🚀 Start Menu (WhatsApp)', callback_data: 'start_bot' }],
                [{ text: '➕ Add Bot to Group', callback_data: 'info_group' }]
            ] 
        }
    });
});

bot.action('start_bot', async (ctx) => {
    await ctx.editMessageCaption(getMenu(ctx.from.first_name, isOwner(ctx)), { parse_mode: 'Markdown' }).catch(async () => {
        await ctx.reply(getMenu(ctx.from.first_name, isOwner(ctx)), { parse_mode: 'Markdown' });
    });
});

// Action d'information pour l'ajout dans un groupe
bot.action('info_group', async (ctx) => {
    const text = `🤖 *TELEGRAM GROUP SETUP*\n\n` +
                 `To use moderation commands (Anti-link, Welcome) in your group:\n\n` +
                 `1️⃣ Click the button below to add the bot.\n` +
                 `2️⃣ Promote the bot as **Admin** with delete message rights.\n` +
                 `3️⃣ The bot is ready to work!`;

    const botUsername = ctx.botInfo?.username || 'KayaMdBot';
    await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Add to my Group', url: `https://t.me/${botUsername}?startgroup=true` }]
            ]
        }
    });
});

// Commande /group pour les utilisateurs qui l'invoquent depuis le chat du bot
bot.command('group', async (ctx) => {
    const text = `🤖 *TELEGRAM GROUP SETUP*\n\n` +
                 `To enable moderation and welcome features in your group:\n\n` +
                 `1. Add the bot to your group.\n` +
                 `2. Make the bot an **Administrator**.\n\n` +
                 `Click below to add it directly:`;

    const botUsername = ctx.botInfo?.username || 'KayaMdBot';
    await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Add to my Group', url: `https://t.me/${botUsername}?startgroup=true` }]
            ]
        }
    });
});

bot.command('ping', async (ctx) => {
    ctx.reply('▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\n✅ *Status:* Online', { parse_mode: 'Markdown' });
});

bot.command('connect', async (ctx) => {
    const activeSessions = getActiveSessions();
    if (activeSessions.length >= 60) {
        return ctx.reply('❌ *Error:* Server capacity reached (60/60). Please try again later.');
    }

    if (!(await checkChannels(ctx))) {
        return ctx.reply('⚠️ Restricted access. Please join our channels to continue:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📢 Join KAYA BOT', url: 'https://t.me/+KSF_nOWYytRhYjg0' }],
                    [{ text: '📢 Join KAYA BOT CHANNEL', url: 'https://t.me/kayatech2' }],
                    [{ text: '✅ I Have Joined', callback_data: 'check_join' }]
                ]
            }
        });
    }

    const text = ctx.message.text.split(' ')[1];
    if (!text) return ctx.reply('⚠️ Usage: `/connect 243xxxxxx`', { parse_mode: 'Markdown' });
    
    const number = text.replace(/\D/g, '');
    if (number.length < 9) return ctx.reply('❌ Invalid number. Minimum 9 digits required.');
    
    const jid = number + "@s.whatsapp.net";
    const teleId = ctx.from.id;
    const userName = ctx.from.first_name || "Unknown";
    
    const requestPath = path.join(pairingFolder, `request_${teleId}.json`);
    fs.writeFileSync(requestPath, JSON.stringify({ jid, name: userName }));
    
    ctx.reply('⏳ Initialization... please wait.');
    
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
        const pairingStyle = `▰▰▰▰▰▰▰▰▰▰\n> ╢ PAIRING CODE ♰\n╭▰▰▰▰▰▰▰◈\n┆🔑 Code: \`${cuObj.code}\`\n╰▰▰▰▰▰▰▰◈`;
        ctx.reply(pairingStyle, { parse_mode: 'Markdown' });
    } else {
        ctx.reply('❌ Error: Pairing code could not be generated.');
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
    const activeSessions = getActiveSessions();
    if (activeSessions.length === 0) return ctx.reply('No devices linked.');

    let text = `> ╢ CONNECTED : ${activeSessions.length}/60 ♰\n`;
    
    activeSessions.forEach((number, i) => {
        let userName = "Unknown";
        let teleId = "N/A";
        
        try {
            const files = fs.readdirSync(pairingFolder);
            for (const f of files) {
                if (f.startsWith('pairing_') && f.endsWith('.json')) {
                    const data = JSON.parse(fs.readFileSync(path.join(pairingFolder, f), 'utf-8'));
                    if ((data.number || "").replace(/[^0-9]/g, "") === number) {
                        userName = data.userName || "Unknown";
                        teleId = f.replace('pairing_', '').replace('.json', '');
                        break;
                    }
                }
            }
        } catch (e) {}

        text += `┆❏ ${i + 1}. *${userName}* (${number}) [TeleID: ${teleId}]\n`;
    });
    
    ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.command('delpair', async (ctx) => {
    if (!isOwner(ctx)) return; 
    const arg = ctx.message.text.split(' ')[1];
    if (!arg) return ctx.reply('⚠️ Usage: /delpair [teleId or number]');
    
    let teleId = arg.replace(/\D/g, '');
    let foundNumber = null;

    const pairingFiles = fs.readdirSync(pairingFolder).filter(e => e.endsWith('.json') && e.startsWith('pairing_'));
    for (const file of pairingFiles) {
        const fileTeleId = file.replace('pairing_', '').replace('.json', '');
        try {
            const data = JSON.parse(fs.readFileSync(path.join(pairingFolder, file), 'utf-8'));
            const num = (data.number || "").replace(/[^0-9]/g, "");
            if (fileTeleId === teleId || num === teleId) {
                foundNumber = num;
                teleId = fileTeleId;
                break;
            }
        } catch (e) {}
    }

    if (foundNumber) {
        forceCleanupSession(foundNumber, teleId);
        return ctx.reply(`✅ Session for ${foundNumber} disconnected successfully.`);
    }

    if (fs.existsSync(path.join(pairingFolder, teleId))) {
        forceCleanupSession(teleId, "default");
        return ctx.reply(`✅ Session ${teleId} disconnected successfully.`);
    }

    ctx.reply('❌ Session not found.');
});

bot.launch().then(() => console.log('▉ KAYA BOT is online with active token.'));
