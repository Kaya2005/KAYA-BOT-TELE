// ==========================================
// FICHIER : commandtele/chatbot.js
// ==========================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFolder = path.join(__dirname, '../database/chatbot');
const apiKeyPath = path.join(__dirname, '../database/openrouter_key.json');

// Ensure the directory exists
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

// RAM memory cache for maximum performance
const memoryCache = new Map();

// Get the specific JSON file path for a group
function getGroupFilePath(chatId) {
    return path.join(dbFolder, `${chatId}.json`);
}

// Load or create a group's configuration
function getConfig(chatId) {
    if (memoryCache.has(chatId)) {
        return memoryCache.get(chatId);
    }

    const filePath = getGroupFilePath(chatId);

    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const config = JSON.parse(data);
            memoryCache.set(chatId, config);
            return config;
        } catch (err) {
            console.error(`[CHATBOT DB READ ERROR] ${chatId}:`, err);
        }
    }

    const defaultConfig = { enabled: false };
    saveConfig(chatId, defaultConfig);
    return defaultConfig;
}

// Save the group configuration to its dedicated file
function saveConfig(chatId, config) {
    memoryCache.set(chatId, config);
    try {
        const filePath = getGroupFilePath(chatId);
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
    } catch (err) {
        console.error(`[CHATBOT DB SAVE ERROR] ${chatId}:`, err);
    }
}

// --- OPENROUTER API KEY MANAGEMENT (BOT-WIDE) ---
function getOpenRouterKey() {
    try {
        if (fs.existsSync(apiKeyPath)) {
            const data = JSON.parse(fs.readFileSync(apiKeyPath, 'utf8'));
            return data.key || '';
        }
    } catch { }
    return '';
}

function saveOpenRouterKey(key) {
    try {
        const dir = path.dirname(apiKeyPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(apiKeyPath, JSON.stringify({ key }, null, 2), 'utf8');
    } catch (err) {
        console.error("[OPENROUTER KEY SAVE ERROR]:", err);
    }
}

// Administrator check
async function checkAdmin(ctx) {
    if (!ctx.chat || ctx.chat.type === 'private') return true;
    if (ctx.sender_chat || (ctx.from && ctx.from.id === 1087968824)) return true;
    try {
        const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
        return ['creator', 'administrator'].includes(member.status);
    } catch {
        return false;
    }
}

// Interactive configuration panel (Menu)
async function handleChatbotConfig(ctx) {
    if (!ctx.chat || !['supergroup', 'group'].includes(ctx.chat.type)) {
        return ctx.reply("<blockquote>❌ This command can only be used inside a group.</blockquote>", { 
            parse_mode: 'HTML', 
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    if (!(await checkAdmin(ctx))) {
        return ctx.reply("<blockquote>⚠️ Only administrators can configure the chatbot.</blockquote>", { 
            parse_mode: 'HTML', 
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    const chatId = ctx.chat.id;
    const config = getConfig(chatId);
    const statusText = config.enabled ? "🟢 Enabled (ON)" : "🔴 Disabled (OFF)";

    const text = `<blockquote>🤖 <b>AI Chatbot Management (OpenRouter)</b>\n\nCurrent Status: ${statusText}\n\nChoose an option:</blockquote>`;
    const keyboard = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Chatbot ON', callback_data: 'chatbot_on' },
                    { text: '❌ Chatbot OFF', callback_data: 'chatbot_off' }
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

export default function setupChatbot(bot) {
    // OpenRouter API Key command
    bot.command('setopenrouterkey', async (ctx) => {
        const text = ctx.message.text.split(' ')[1];
        if (!text) {
            return ctx.reply('<blockquote>⚠️ Usage: <code>/setopenrouterkey sk-or-v1-...</code></blockquote>', { parse_mode: 'HTML' });
        }
        saveOpenRouterKey(text);
        return ctx.reply('<blockquote>✅ OpenRouter API key successfully registered for the Telegram chatbot!</blockquote>', { parse_mode: 'HTML' });
    });

    // /chatbot command
    bot.command('chatbot', async (ctx) => {
        const args = ctx.message.text.split(' ')[1]?.toLowerCase();
        const chatId = ctx.chat.id;

        if (args === 'on' || args === 'off') {
            if (!(await checkAdmin(ctx))) return ctx.reply('<blockquote>❌ Action restricted to administrators.</blockquote>', { parse_mode: 'HTML' });
            
            const config = getConfig(chatId);
            config.enabled = (args === 'on');
            saveConfig(chatId, config);

            if (config.enabled) {
                return ctx.reply('<blockquote>🤖 AI Chatbot (OpenRouter) enabled for this group! Mention me or reply to my messages to chat.</blockquote>', { parse_mode: 'HTML' });
            } else {
                return ctx.reply('<blockquote>🤖 Chatbot disabled for this group.</blockquote>', { parse_mode: 'HTML' });
            }
        }

        await handleChatbotConfig(ctx);
    });

    // Main menu button (groupmenu)
    bot.action('menu_chatbot', async (ctx) => {
        await ctx.answerCbQuery();
        await handleChatbotConfig(ctx);
    });

    // ON / OFF actions from inline buttons
    bot.action(/^chatbot_(on|off)$/, async (ctx) => {
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
                ? "<blockquote>🟢 The AI Chatbot has been <b>ENABLED</b> for this group.</blockquote>" 
                : "<blockquote>🔴 The AI Chatbot has been <b>DISABLED</b>.</blockquote>";

            await ctx.answerCbQuery(config.enabled ? "Chatbot enabled!" : "Chatbot disabled!");
            await ctx.editMessageText(statusText, {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [] }
            });
        } catch (err) {
            console.error("[CHATBOT ACTION ERROR]:", err);
            await ctx.answerCbQuery("An error occurred.", { show_alert: true });
        }
    });

    // Group text message listener
    bot.on('text', async (ctx, next) => {
        try {
            if (ctx.chat.type === 'private') return next();

            const chatId = ctx.chat.id;
            const config = getConfig(chatId);

            if (!config.enabled) return next();

            const message = ctx.message;
            const botUsername = ctx.botInfo?.username;
            const text = message.text || '';
            
            const isTagged = botUsername && text.includes(`@${botUsername}`);
            const isReplyToBot = message.reply_to_message && message.reply_to_message.from?.id === ctx.botInfo?.id;

            if (isTagged || isReplyToBot) {
                const cleanQuery = text.replace(new RegExp(`@${botUsername}`, 'gi'), '').trim();
                if (!cleanQuery) return next();

                const apiKey = getOpenRouterKey();

                if (!apiKey) {
                    await ctx.reply('<blockquote>⚠️ The administrator has not configured the OpenRouter API key with <code>/setopenrouterkey</code>.</blockquote>', { 
                        parse_mode: 'HTML', 
                        reply_to_message_id: message.message_id 
                    });
                    return;
                }

                // Simulate "typing..." action
                await ctx.telegram.sendChatAction(chatId, 'typing').catch(() => {});

                const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://github.com/kaya-bot',
                        'X-Title': 'KAYA BOT'
                    },
                    body: JSON.stringify({
                        model: 'openrouter/free',
                        messages: [
                            { 
                                role: 'system', 
                                content: "You are a teenager (a normal teen). You reply to messages in a very casual, natural, and friendly way, sometimes using common slang, text abbreviations, a bit of humor, without unnecessary capital letters, and ABOVE ALL, NEVER acting like a polite AI or a virtual assistant. Keep your sentences short, direct, and lively. IMPORTANT: Always reply in the exact same language as the user's message while keeping this exact teen personality." 
                            },
                            { role: 'user', content: cleanQuery }
                        ],
                        temperature: 0.8
                    })
                });

                const json = await apiResponse.json();
                let answer = "";
                
                if (json.choices && json.choices[0]?.message?.content) {
                    answer = json.choices[0].message.content;
                } else {
                    answer = json.error?.message || "Oops, there's a technical bug right now, try again later lol";
                }

                await ctx.reply(answer, {
                    reply_to_message_id: message.message_id
                });
                return;
            }
        } catch (e) {
            console.error("[CHATBOT ERROR]:", e);
        }
        return next();
    });
}
