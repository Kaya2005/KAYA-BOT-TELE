// ==========================================
// FICHIER : commandtele/chatbot.js
// ==========================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFolder = path.join(__dirname, '../database/chatbot');
const apiKeyPath = path.join(__dirname, '../database/groq_key.json');

// Garantir que le dossier existe
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

// Cache en mémoire RAM pour des performances maximales
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
            console.error(`[CHATBOT DB READ ERROR] ${chatId}:`, err);
        }
    }

    // 3. Configuration par défaut (désactivé par défaut)
    const defaultConfig = { enabled: false };
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
        console.error(`[CHATBOT DB SAVE ERROR] ${chatId}:`, err);
    }
}

// --- GESTION DE LA CLÉ GROQ (GLOBALE AU BOT) ---
function getGroqKey() {
    try {
        if (fs.existsSync(apiKeyPath)) {
            const data = JSON.parse(fs.readFileSync(apiKeyPath, 'utf8'));
            return data.key || '';
        }
    } catch { }
    return '';
}

function saveGroqKey(key) {
    try {
        const dir = path.dirname(apiKeyPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(apiKeyPath, JSON.stringify({ key }, null, 2), 'utf8');
    } catch (err) {
        console.error("[GROQ KEY SAVE ERROR]:", err);
    }
}

// Vérification administrateur
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

// Panneau de configuration interactif (Menu)
async function handleChatbotConfig(ctx) {
    if (!ctx.chat || !['supergroup', 'group'].includes(ctx.chat.type)) {
        return ctx.reply("<blockquote>❌ Cette commande s'utilise uniquement dans un groupe.</blockquote>", { 
            parse_mode: 'HTML', 
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    if (!(await checkAdmin(ctx))) {
        return ctx.reply("<blockquote>⚠️ Seuls les administrateurs peuvent configurer le chatbot.</blockquote>", { 
            parse_mode: 'HTML', 
            reply_to_message_id: ctx.message?.message_id 
        });
    }

    const chatId = ctx.chat.id;
    const config = getConfig(chatId);
    const statusText = config.enabled ? "🟢 Activé (ON)" : "🔴 Désactivé (OFF)";

    const text = `<blockquote>🤖 <b>Gestion du Chatbot IA</b>\n\nÉtat actuel : ${statusText}\n\nChoisissez une option :</blockquote>`;
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
    // Clé API Groq
    bot.command('setgroqkey', async (ctx) => {
        const text = ctx.message.text.split(' ')[1];
        if (!text) {
            return ctx.reply('<blockquote>⚠️ Utilisation : <code>/setgroqkey gsk_...</code></blockquote>', { parse_mode: 'HTML' });
        }
        saveGroqKey(text);
        return ctx.reply('<blockquote>✅ Clé API Groq enregistrée avec succès pour le chatbot Telegram !</blockquote>', { parse_mode: 'HTML' });
    });

    // Commande /chatbot
    bot.command('chatbot', async (ctx) => {
        const args = ctx.message.text.split(' ')[1]?.toLowerCase();
        const chatId = ctx.chat.id;

        if (args === 'on' || args === 'off') {
            if (!(await checkAdmin(ctx))) return ctx.reply('<blockquote>❌ Action réservée aux administrateurs.</blockquote>', { parse_mode: 'HTML' });
            
            const config = getConfig(chatId);
            config.enabled = (args === 'on');
            saveConfig(chatId, config);

            if (config.enabled) {
                return ctx.reply('<blockquote>🤖 Chatbot IA (mode ado) activé pour ce groupe ! Mentionne-moi pour discuter.</blockquote>', { parse_mode: 'HTML' });
            } else {
                return ctx.reply('<blockquote>🤖 Chatbot désactivé pour ce groupe.</blockquote>', { parse_mode: 'HTML' });
            }
        }

        // Si aucun argument n'est fourni, affichage du menu interactif
        await handleChatbotConfig(ctx);
    });

    // Bouton de menu principal (groupmenu)
    bot.action('menu_chatbot', async (ctx) => {
        await ctx.answerCbQuery();
        await handleChatbotConfig(ctx);
    });

    // Actions ON / OFF depuis les boutons inline
    bot.action(/^chatbot_(on|off)$/, async (ctx) => {
        try {
            if (!(await checkAdmin(ctx))) {
                return await ctx.answerCbQuery("⚠️ Action réservée aux administrateurs !", { show_alert: true });
            }

            const action = ctx.match[1];
            const chatId = ctx.chat.id;
            const config = getConfig(chatId);

            config.enabled = (action === 'on');
            saveConfig(chatId, config);

            const statusText = config.enabled 
                ? "<blockquote>🟢 Le Chatbot IA a été <b>ACTIVÉ</b> pour ce groupe.</blockquote>" 
                : "<blockquote>🔴 Le Chatbot IA a été <b>DÉSACTIVÉ</b>.</blockquote>";

            await ctx.answerCbQuery(config.enabled ? "Chatbot activé !" : "Chatbot désactivé !");
            await ctx.editMessageText(statusText, {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [] }
            });
        } catch (err) {
            console.error("[CHATBOT ACTION ERROR]:", err);
            await ctx.answerCbQuery("Une erreur est survenue.", { show_alert: true });
        }
    });

    // Écouteur des messages texte du groupe
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

                const apiKey = getGroqKey();

                if (!apiKey) {
                    await ctx.reply('<blockquote>⚠️ L\'administrateur n\'a pas configuré la clé API Groq avec <code>/setgroqkey</code>.</blockquote>', { 
                        parse_mode: 'HTML', 
                        reply_to_message_id: message.message_id 
                    });
                    return;
                }

                const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            { 
                                role: 'system', 
                                content: "Tu es un adolescent normal, un peu drôle, familier et détendu. Tu parles comme un jeune sur les réseaux (argot, expressions naturelles comme 'wesh', 'mdr', 'frérot', 'grave', etc.). Tu ne te présentes jamais comme une IA, tu réponds simplement de façon naturelle, courte et décontractée." 
                            },
                            { role: 'user', content: cleanQuery }
                        ]
                    })
                });

                const json = await apiResponse.json();
                let answer = "";
                
                if (json.choices && json.choices[0]?.message?.content) {
                    answer = json.choices[0].message.content;
                } else {
                    answer = "Wesh y'a un bug technique là, réessaie plus tard mdr";
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
