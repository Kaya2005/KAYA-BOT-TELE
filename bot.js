import './config.js'; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Telegraf } from 'telegraf';
import { forceCleanupSession } from './pair.js'; 
import { getActiveToken } from './token.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ================= CONSTANTS & PATHS =================
const adminFilePath = path.join(__dirname, './database/admintele.json');
const pairingFolder = path.join(__dirname, './richstore/pairing');
const REQUIRED_CHANNELS = ['@kaya_bot1', '@coupon1xbet243'];

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
    
    let menu = `> 𝙆 𝘼 𝙔 𝘼  •  𝘽 𝙊 𝗧\n` +
               `> ───────────────────\n` +
               `> ᴜ𝐬𝐞𝐫: \`${userName}\`\n` +
               `> 𝐩𝐫𝐞𝐟𝐢𝐱: \`/\`\n` +
               `> 𝐭𝐢𝐦𝐞: \`${time}\`\n` +
               `> 𝐝𝐚𝐭𝐞: \`${date}\`\n\n` +
               `> ╢ 𝙂𝙀𝙉𝙀𝙍𝘼𝙇 ♰\n` +
               `╭▰▰▰▰▰▰▰◈\n` +
               `┆❏ \`/connect\` { TO CONNECT }\n` +
               `┆❏ \`/ping\`    { STATUS }\n` +
               `╰▰▰▰▰▰▰▰◈`;
    
    if (isAdmin) {
        menu += `\n\n> ╢ 𝐎𝐖𝐍𝐄𝐑 ♰\n` +
                `╭▰▰▰▰▰▰▰◈\n` +
                `┆❏ \`/listpair\` { SESSIONS }\n` +
                `┆❏ \`/delpair\`  { REVOKE }\n` +
                `╰▰▰▰▰▰▰▰◈`;
    }
    return menu;
};

// 🚀 Utilisation de getActiveToken() pour récupérer dynamiquement le premier token non utilisé
const bot = new Telegraf(getActiveToken());

// ================= COMMANDS =================
bot.start(async (ctx) => {
    if (!(await checkChannels(ctx))) {
        return ctx.reply('> 𝐀𝐜𝐜𝐞𝐬𝐬 𝐑𝐞𝐬𝐭𝐫𝐢𝐜𝐭𝐞𝐝 — 𝙆𝐀𝙔𝘼 𝘽𝙊𝙏\n\n> Please join our channels to continue:', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Telegram channel 1', url: 'https://t.me/kaya_bot1' }],
                    [{ text: 'Telegram channel 2', url: 'https://t.me/coupon1xbet243' }],
                    [{ text: 'I Have Joined', callback_data: 'check_join' }]
                ]
            }
        });
    }

    await ctx.replyWithPhoto('https://files.catbox.moe/1ddhgm.jpg', {
        caption: '𝙆 𝘼 𝙔 𝘼  •  𝘽 𝙊 𝗧\n\nWelcome. Click the button below to open your dashboard.',
        reply_markup: { inline_keyboard: [[{ text: 'Start Menu', callback_data: 'start_bot' }]] }
    });
});

bot.action('start_bot', async (ctx) => {
    const menuText = getMenu(ctx.from.first_name, isOwner(ctx));
    await ctx.editMessageCaption(menuText, { parse_mode: 'Markdown' }).catch(async () => {
        await ctx.reply(menuText, { parse_mode: 'Markdown' });
    });
});

bot.command('ping', async (ctx) => {
    ctx.reply('𝙆 𝘼 𝙔 𝘼  •  𝘽 𝙊 𝗧\n\nStatus: Online', { parse_mode: 'Markdown' });
});

bot.command('connect', async (ctx) => {
    const sessions = fs.readdirSync(pairingFolder).filter(e => e.endsWith('.json') && e.startsWith('pairing_'));
    if (sessions.length >= 60) {
        return ctx.reply('Error: Server capacity reached (60/60). Please try again later.');
    }

    if (!(await checkChannels(ctx))) {
        return ctx.reply('> 𝐀𝐜𝐜𝐞𝐬𝐬 𝐑𝐞𝐬𝐭𝐫𝐢𝐜𝐭𝐞𝐝 — 𝙆𝐀𝙔𝘼 𝘽𝙊𝙏\n\n> Please join our channels to continue:', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Telegram channel 1', url: 'https://t.me/kaya_bot1' }],
                    [{ text: 'Telegram channel 2', url: 'https://t.me/coupon1xbet243' }],
                    [{ text: 'I Have Joined', callback_data: 'check_join' }]
                ]
            }
        });
    }

    const text = ctx.message.text.split(' ')[1];
    if (!text) return ctx.reply('Usage: `/connect 243xxxxxx`', { parse_mode: 'Markdown' });
    
    const number = text.replace(/\D/g, '');
    if (number.length < 9) return ctx.reply('Invalid number. Minimum 9 digits required.');
    
    const jid = number + "@s.whatsapp.net";
    const teleId = ctx.from.id;
    const userName = ctx.from.first_name || "Unknown";
    
    const requestPath = path.join(pairingFolder, `request_${teleId}.json`);
    fs.writeFileSync(requestPath, JSON.stringify({ jid, name: userName }));
    
    ctx.reply('Initialization... please wait.');
    
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
        const pairingStyle = `> ╢ 𝐏𝐀𝐈𝐑𝐈𝐍𝐆 𝐂𝐎𝐃𝐄 ♰\n╭▰▰▰▰▰▰▰◈\n┆❏ Code: \`${cuObj.code}\`\n╰▰▰▰▰▰▰▰◈`;
        ctx.reply(pairingStyle, { parse_mode: 'Markdown' });
    } else {
        ctx.reply('Error: Pairing code could not be generated.');
    }
});

bot.action('check_join', async (ctx) => {
    if (await checkChannels(ctx)) {
        await ctx.editMessageText('Access authorized. You can connect now.');
        ctx.answerCbQuery('Success.');
    } else {
        ctx.answerCbQuery('You must join the required channels first.', { show_alert: true });
    }
});

bot.command('listpair', async (ctx) => {
    if (!isOwner(ctx)) return;
    const sessions = fs.readdirSync(pairingFolder).filter(e => e.endsWith('.json') && e.startsWith('pairing_'));
    if (sessions.length === 0) return ctx.reply('No devices linked.');

    let text = `> ╢ 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 : ${sessions.length}/60 ♰\n╭▰▰▰▰▰▰▰◈\n`;
    sessions.forEach((s, i) => {
        const teleId = s.replace('pairing_', '').replace('.json', '');
        let userName = "Unknown";
        try {
            const data = JSON.parse(fs.readFileSync(path.join(pairingFolder, s), 'utf-8'));
            userName = data.userName || "Unknown";
        } catch (e) {}
        text += `┆❏ ${i + 1}. *${userName}* (\`${teleId}\`)\n`;
    });
    text += `╰▰▰▰▰▰▰▰◈`;
    ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.command('delpair', async (ctx) => {
    if (!isOwner(ctx)) return;
    const teleId = ctx.message.text.split(' ')[1]?.replace(/\D/g, '');
    if (!teleId) return ctx.reply('Usage: `/delpair [teleId]`', { parse_mode: 'Markdown' });
    
    const pairingFile = path.join(pairingFolder, `pairing_${teleId}.json`);
    if (fs.existsSync(pairingFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(pairingFile, 'utf-8'));
            const number = data.number.replace(/[^0-9]/g, "");
            forceCleanupSession(number, teleId);
            ctx.reply(`Session \`${teleId}\` disconnected.`, { parse_mode: 'Markdown' });
        } catch (e) { ctx.reply('Error cleaning up session.'); }
    } else { ctx.reply('Session not found.'); }
});

bot.launch().then(() => console.log('KAYA BOT is online with active token.'));
