// ==========================================
// FILE : commandtele/welcome.js
// ==========================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFolder = path.join(__dirname, '../database/welcome');

// Garantir que le dossier existe
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

// Cache en mémoire RAM pour éviter la lecture disque répétée
const memoryCache = new Map();

// Obtenir le chemin du fichier JSON propre à un groupe
function getGroupFilePath(chatId) {
    return path.join(dbFolder, `${chatId}.json`);
}

// Charge ou crée la configuration d'un groupe
function getConfig(chatId) {
    // 1. Retour direct si présent en mémoire
    if (memoryCache.has(chatId)) {
        return memoryCache.get(chatId);
    }

    const filePath = getGroupFilePath(chatId);

    // 2. Lecture depuis le fichier du groupe s'il existe
    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const config = JSON.parse(data);
            memoryCache.set(chatId, config);
            return config;
        } catch (err) {
            console.error(`[WELCOME DB READ ERROR] ${chatId}:`, err);
        }
    }

    // 3. Configuration par défaut
    const defaultConfig = { enabled: true };
    saveConfig(chatId, defaultConfig);
    return defaultConfig;
}

// Sauvegarde la configuration du groupe dans son fichier dédié
function saveConfig(chatId, config) {
    memoryCache.set(chatId, config);
    try {
        const filePath = getGroupFilePath(chatId);
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
    } catch (err) {
        console.error(`[WELCOME DB SAVE ERROR] ${chatId}:`, err);
    }
}

async function checkAdmin(ctx) {
    if (!ctx.chat || ctx.chat.type === 'private') return true;
    
    // Autoriser automatiquement les administrateurs anonymes / propriétaires de canal
    if (ctx.sender_chat || (ctx.from && ctx.from.id === 1087968824)) {
        return true;
    }

    try {
        const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
        return ['creator', 'administrator'].includes(member.status);
    } catch (err) {
        console.error("[WELCOME] Admin check error:", err);
        return false;
    }
}

// Affichage du panneau de configuration
async function handleWelcomeConfig(ctx) {
    if (!ctx.chat || !['supergroup', 'group'].includes(ctx.chat.type)) {
        return ctx.reply("<blockquote>This command can only be used in a group.</blockquote>", { 
            parse_mode: 'HTML', 
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    if (!(await checkAdmin(ctx))) {
        return ctx.reply("<blockquote>⚠️ Only administrators can configure the welcome module.</blockquote>", { 
            parse_mode: 'HTML', 
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    const chatId = ctx.chat.id;
    const config = getConfig(chatId);
    const statusText = config.enabled ? "🟢 Enabled (ON)" : "🔴 Disabled (OFF)";

    const text = `<blockquote>⚙️ <b>Welcome Module Management</b>\n\nCurrent Status: ${statusText}\n\nChoose an option:</blockquote>`;
    const keyboard = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Welcome ON', callback_data: 'welcome_on' },
                    { text: '❌ Welcome OFF', callback_data: 'welcome_off' }
                ]
            ]
        }
    };

    if (ctx.callbackQuery) {
        await ctx.editMessageText(text, keyboard).catch(() => ctx.reply(text, keyboard));
    } else {
        await ctx.reply(text, { 
            ...keyboard, 
            reply_to_message_id: ctx.message?.message_id 
        });
    }
}

export default function setupWelcome(bot) {
    // Triggers par commande et texte brut
    bot.command('welcome', handleWelcomeConfig);
    bot.hears(/^welcome$/i, handleWelcomeConfig);

    // Trigger via bouton du menu principal
    bot.action('menu_welcome', async (ctx) => {
        await ctx.answerCbQuery();
        await handleWelcomeConfig(ctx);
    });

    // Clics ON / OFF
    bot.action(/^welcome_(on|off)$/, async (ctx) => {
        try {
            if (!(await checkAdmin(ctx))) {
                return await ctx.answerCbQuery("⚠️ Action restricted to administrators!", { show_alert: true });
            }

            const action = ctx.match[1];
            const chatId = ctx.chat.id;
            const config = getConfig(chatId);

            config.enabled = (action === 'on');
            saveConfig(chatId, config);

            const statusText = config.enabled 
                ? "<blockquote>🟢 The Welcome module has been <b>ENABLED</b>.</blockquote>" 
                : "<blockquote>🔴 The Welcome module has been <b>DISABLED</b>.</blockquote>";

            await ctx.answerCbQuery(config.enabled ? "Welcome enabled!" : "Welcome disabled!");
            await ctx.editMessageText(statusText, {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [] }
            });
        } catch (err) {
            console.error("[WELCOME ACTION ERROR]:", err);
            await ctx.answerCbQuery("An error occurred.", { show_alert: true });
        }
    });

    // Envoi du message de bienvenue aux nouveaux membres
    bot.on('new_chat_members', async (ctx, next) => {
        try {
            if (!ctx.message || !ctx.message.new_chat_members) {
                return next();
            }

            const chatId = ctx.chat.id;
            const config = getConfig(chatId);
            if (!config.enabled) {
                return next();
            }

            for (const member of ctx.message.new_chat_members) {
                if (ctx.botInfo && member.id === ctx.botInfo.id) continue;

                const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ');
                const username = member.username ? `@${member.username}` : 'None';
                const id = member.id;

                const now = new Date();
                const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                const date = now.toLocaleDateString('en-GB');

                const welcomeText = `<blockquote>▰▰▰▰▰▰▰▰▰▰
➠ ᴜsᴇʀ : ${fullName}
➠ ᴛɪᴍᴇ : ${time}
➠ ᴅᴀᴛᴇ : ${date}

    🇼​🇪​🇱​🇨​🇴​🇲​🇪​ 
╭▰▰▰▰▰▰▰◈
┆❏ 🙋 ᴜsᴇʀɴᴀᴍᴇ : ${username}
┆❏ 🆔 ɪᴅ : ${id}
╰▰▰▰▰▰▰▰◈</blockquote>`;

                const options = {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙰𝙽𝙰𝙻', url: 'https://t.me/kayatech2' }]
                        ]
                    }
                };

                let photoFileId = null;
                try {
                    const profilePhotos = await ctx.telegram.getUserProfilePhotos(member.id, { limit: 1 });
                    if (profilePhotos && profilePhotos.total_count > 0) {
                        const photos = profilePhotos.photos[0];
                        photoFileId = photos[photos.length - 1].file_id;
                    }
                } catch (e) {
                    console.error("Failed to retrieve profile picture:", e);
                }

                if (photoFileId) {
                    await ctx.replyWithPhoto(photoFileId, { 
                        caption: welcomeText,
                        ...options 
                    });
                } else {
                    await ctx.reply(welcomeText, options);
                }
            }
            
            return next();
        } catch (err) {
            console.error("[WELCOME ERROR CRITICAL]:", err);
            return next();
        }
    });
}
