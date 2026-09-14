// ==========================================
// FILE : commandtele/welcome.js (Corrigé & Fonctionnel)
// ==========================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFolder = path.join(__dirname, '../database/welcome');
const langFilePath = path.join(__dirname, '../database/languages.json');

if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

const memoryCache = new Map();

function getLang(chatId) {
    try {
        if (fs.existsSync(langFilePath)) {
            const data = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
            return data[String(chatId)] || 'en';
        }
    } catch (e) {}
    return 'en';
}

function getGroupFilePath(chatId) {
    return path.join(dbFolder, `${chatId}.json`);
}

function getConfig(chatId) {
    if (memoryCache.has(chatId)) return memoryCache.get(chatId);
    const filePath = getGroupFilePath(chatId);
    if (fs.existsSync(filePath)) {
        try {
            const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            memoryCache.set(chatId, config);
            return config;
        } catch (err) {}
    }
    const defaultConfig = { enabled: true };
    saveConfig(chatId, defaultConfig);
    return defaultConfig;
}

function saveConfig(chatId, config) {
    memoryCache.set(chatId, config);
    try {
        fs.writeFileSync(getGroupFilePath(chatId), JSON.stringify(config, null, 2), 'utf8');
    } catch (err) {}
}

async function checkAdmin(ctx) {
    if (!ctx.chat || ctx.chat.type === 'private') return true;
    if (ctx.sender_chat || (ctx.from && ctx.from.id === 1087968824)) return true;
    try {
        const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
        return ['creator', 'administrator'].includes(member.status);
    } catch { return false; }
}

async function handleWelcomeConfig(ctx) {
    if (!ctx.chat || !['supergroup', 'group'].includes(ctx.chat.type)) return;
    if (!(await checkAdmin(ctx))) return;

    const chatId = ctx.chat.id;
    const lng = getLang(chatId);
    const config = getConfig(chatId);
    
    const statusText = lng === 'fr' 
        ? (config.enabled ? "🟢 Activé (ON)" : "🔴 Désactivé (OFF)")
        : (config.enabled ? "🟢 Enabled (ON)" : "🔴 Disabled (OFF)");

    const text = lng === 'fr'
        ? `<blockquote>⚙️ <b>Gestion du Module Bienvenue</b>\n\nStatut actuel : ${statusText}\n\nChoisissez une option :</blockquote>`
        : `<blockquote>⚙️ <b>Welcome Module Management</b>\n\nCurrent Status: ${statusText}\n\nChoose an option:</blockquote>`;

    const keyboard = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: lng === 'fr' ? '✅ Bienvenue ON' : '✅ Welcome ON', callback_data: 'welcome_on' },
                    { text: lng === 'fr' ? '❌ Bienvenue OFF' : '❌ Welcome OFF', callback_data: 'welcome_off' }
                ]
            ]
        }
    };

    if (ctx.callbackQuery) {
        await ctx.editMessageText(text, keyboard).catch(() => ctx.reply(text, keyboard).catch(() => {}));
    } else {
        await ctx.reply(text, { ...keyboard, reply_to_message_id: ctx.message?.message_id }).catch(() => {});
    }
}

export default function setupWelcome(bot) {
    bot.command('welcome', handleWelcomeConfig);
    bot.hears(/^welcome$/i, handleWelcomeConfig);

    bot.action('menu_welcome', async (ctx) => {
        try { await ctx.answerCbQuery(); } catch (e) {}
        await handleWelcomeConfig(ctx);
    });

    bot.action(/^welcome_(on|off)$/, async (ctx) => {
        try {
            if (!(await checkAdmin(ctx))) {
                const lng = getLang(ctx.chat.id);
                return await ctx.answerCbQuery(lng === 'fr' ? "⚠️ Action réservée aux administrateurs !" : "⚠️ Action restricted to administrators!", { show_alert: true });
            }

            const action = ctx.match[1];
            const chatId = ctx.chat.id;
            const lng = getLang(chatId);
            const config = getConfig(chatId);

            config.enabled = (action === 'on');
            saveConfig(chatId, config);

            const statusText = lng === 'fr'
                ? (config.enabled ? "<blockquote>🟢 Le module de bienvenue a été <b>ACTIVÉ</b>.</blockquote>" : "<blockquote>🔴 Le module de bienvenue a été <b>DÉSACTIVÉ</b>.</blockquote>")
                : (config.enabled ? "<blockquote>🟢 The Welcome module has been <b>ENABLED</b>.</blockquote>" : "<blockquote>🔴 The Welcome module has been <b>DISABLED</b>.</blockquote>");

            await ctx.answerCbQuery(config.enabled ? (lng === 'fr' ? "Bienvenue activé !" : "Welcome enabled!") : (lng === 'fr' ? "Bienvenue désactivé !" : "Welcome disabled!"));
            await ctx.editMessageText(statusText, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } }).catch(() => {});
        } catch (err) {}
    });

    // Restauration de l'écouteur natif qui fonctionnait dans ton ancien code
    bot.on('new_chat_members', async (ctx, next) => {
        try {
            if (!ctx.message || !ctx.message.new_chat_members) {
                return next();
            }

            const chatId = ctx.chat.id;
            const config = getConfig(chatId);
            if (!config.enabled) return next();

            const botId = ctx.botInfo?.id;
            const newMembers = ctx.message.new_chat_members;

            for (const member of newMembers) {
                if (botId && member.id === botId) continue;

                const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ');
                const username = member.username ? `@${member.username}` : 'None';
                const id = member.id;

                const now = new Date();
                const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lubumbashi' });
                const date = now.toLocaleDateString('en-GB', { timeZone: 'Africa/Lubumbashi' });

                const welcomeText = `<blockquote>▰▰▰▰▰▰▰▰▰▰
➠ ᴜsᴇʀ : ${fullName}
➠ ᴛɪᴍᴇ : ${time}
➠ ᴅᴀᴛᴇ : ${date}

    🇼​🇪​🇱​🇨​🇴​🇲​🇪​ 
╭▰▰▰▰▰▰▰◈
┆❏ 🙋 ᴜsᴇʀɴᴀᴍᴇ : ${username}
┆❏ 🆔 ɪᴅ : ${id}
╰▰▰▰▰▰▰▰◈</blockquote>`;

                let photoFileId = null;
                try {
                    const profilePhotos = await ctx.telegram.getUserProfilePhotos(member.id, { limit: 1 });
                    if (profilePhotos?.total_count > 0) {
                        const photos = profilePhotos.photos[0];
                        photoFileId = photos[photos.length - 1].file_id;
                    }
                } catch (e) {}

                try {
                    if (photoFileId) {
                        await ctx.replyWithPhoto(photoFileId, { 
                            caption: welcomeText, 
                            parse_mode: 'HTML', 
                            reply_markup: { inline_keyboard: [[{ text: '𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙰𝙽𝙰𝙻', url: 'https://t.me/kayatech2' }]] } 
                        });
                    } else {
                        await ctx.reply(welcomeText, { 
                            parse_mode: 'HTML', 
                            reply_markup: { inline_keyboard: [[{ text: '𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙰𝙽𝙰𝙻', url: 'https://t.me/kayatech2' }]] } 
                        });
                    }
                } catch (sendErr) {}
            }

            return next();
        } catch (err) {
            return next();
        }
    });
}
