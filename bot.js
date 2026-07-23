import './config.js'; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Telegraf } from 'telegraf';
import { forceCleanupSession } from './pair.js'; 
import { getActiveToken } from './token.js'; // 👈 Modifié ici pour importer la fonction

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ================= CONSTANTS & PATHS =================
const adminFilePath = path.join(__dirname, './database/admintele.json');
const pairingFolder = path.join(__dirname, './richstore/pairing');
const REQUIRED_CHANNELS = ['-1004453499318', '@coupon1xbet243'];

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
╰▰▰▰▰▰▰▰◈`;
    
    if (isAdmin) {
        menu += `\n\n> ╢ OWNER ♰\n╭▰▰▰▰▰▰▰◈\n┆❏ /listpair\n┆❏ /delpair\n╰▰▰▰▰▰▰▰◈`;
    }
    return menu;
};

// 🚀 Utilisation de getActiveToken() pour récupérer dynamiquement le premier token non utilisé (active: false)
const bot = new Telegraf(getActiveToken());

// ================= COMMANDS =================
bot.start(async (ctx) => {
    await ctx.replyWithPhoto('https://files.catbox.moe/1ddhgm.jpg', {
        caption: '▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\nWelcome! Click the button below to open your dashboard.',
        reply_markup: { inline_keyboard: [[{ text: '🚀 Start Menu', callback_data: 'start_bot' }]] }
    });
});

bot.action('start_bot', async (ctx) => {
    await ctx.editMessageCaption(getMenu(ctx.from.first_name, isOwner(ctx)), { parse_mode: 'Markdown' }).catch(async () => {
        await ctx.reply(getMenu(ctx.from.first_name, isOwner(ctx)), { parse_mode: 'Markdown' });
    });
});

bot.command('ping', async (ctx) => {
    ctx.reply('▉ 𝐊𝐀𝐘𝐀 𝐁𝐎𝐓 ▉\n\n✅ *Status:* Online', { parse_mode: 'Markdown' });
});

bot.command('connect', async (ctx) => {
    // 1. Vérification de la limite globale (60 utilisateurs)
    const sessions = fs.readdirSync(pairingFolder).filter(e => e.endsWith('.json') && e.startsWith('pairing_'));
    if (sessions.length >= 60) {
        return ctx.reply('❌ *Error:* Server capacity reached (60/60). Please try again later.');
    }

    // 2. Vérification des canaux
    if (!(await checkChannels(ctx))) {
        return ctx.reply('⚠️ Restricted access. Please join our channels to continue:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📢 Join KAYA BOT', url: 'https://t.me/+KSF_nOWYytRhYjg0' }],
                    [{ text: '📢 Join KAYA BOT CHANNEL', url: 'https://t.me/coupon1xbet243' }],
                    [{ text: '✅ I Have Joined', callback_data: 'check_join' }]
                ]
            }
        });
    }

    const text = ctx.message.text.split(' ')[1];
    if (!text) return ctx.reply('⚠️ Usage: `/connect 243xxxxxx`', { parse_mode: 'Markdown' });
    
    // 3. Validation du numéro (minimum 9 chiffres)
    const number = text.replace(/\D/g, '');
    if (number.length < 9) return ctx.reply('❌ Invalid number. Minimum 9 digits required.');
    
    const jid = number + "@s.whatsapp.net";
    const teleId = ctx.from.id;
    const userName = ctx.from.first_name || "Unknown";
    
    // 4. Écriture de la requête pour que pair.js la traite
    const requestPath = path.join(pairingFolder, `request_${teleId}.json`);
    fs.writeFileSync(requestPath, JSON.stringify({ jid, name: userName }));
    
    ctx.reply('⏳ Initialization... please wait.');
    
    // 5. Attente de la réponse
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
    const sessions = fs.readdirSync(pairingFolder).filter(e => e.endsWith('.json') && e.startsWith('pairing_'));
    if (sessions.length === 0) return ctx.reply('No devices linked.');

    let text = `> ╢ CONNECTED : ${sessions.length}/60 ♰\n`;
    sessions.forEach((s, i) => {
        const teleId = s.replace('pairing_', '').replace('.json', '');
        let userName = "Unknown";
        try {
            const data = JSON.parse(fs.readFileSync(path.join(pairingFolder, s), 'utf-8'));
            userName = data.userName || "Unknown";
        } catch (e) {}
        text += `┆❏ ${i + 1}. *${userName}* (${teleId})\n`;
    });
    ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.command('delpair', async (ctx) => {
    if (!isOwner(ctx)) return;
    const teleId = ctx.message.text.split(' ')[1]?.replace(/\D/g, '');
    if (!teleId) return ctx.reply('⚠️ Usage: /delpair [teleId]');
    
    const pairingFile = path.join(pairingFolder, `pairing_${teleId}.json`);
    if (fs.existsSync(pairingFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(pairingFile, 'utf-8'));
            const number = data.number.replace(/[^0-9]/g, "");
            forceCleanupSession(number, teleId);
            ctx.reply(`✅ Session ${teleId} disconnected.`);
        } catch (e) { ctx.reply('❌ Error cleaning up session.'); }
    } else { ctx.reply('❌ Session not found.'); }
});

bot.launch().then(() => console.log('▉ KAYA BOT is online with active token.'));
