// ==========================================
// FICHIER : commandtele/chatbot.js
// ==========================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../database/chatbot_groups.json');
const apiKeyPath = path.join(__dirname, '../database/groq_key.json');

const loadDb = (filePath, defaultVal) => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
        }
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return defaultVal;
    }
};

const saveDb = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Fonction utilitaire pour vérifier si l'utilisateur est admin
async function checkAdmin(ctx) {
    if (ctx.chat.type === 'private') return true; // En privé c'est bon
    try {
        const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
        return ['creator', 'administrator'].includes(member.status);
    } catch {
        return false;
    }
}

export default function setupChatbot(bot) {
    // Commande pour configurer la clé API Groq
    bot.command('setgroqkey', async (ctx) => {
        const text = ctx.message.text.split(' ')[1];
        if (!text) {
            return ctx.reply('<blockquote>⚠️ Utilisation : <code>/setgroqkey gsk_...</code></blockquote>', { parse_mode: 'HTML' });
        }
        saveDb(apiKeyPath, { key: text });
        return ctx.reply('<blockquote>✅ Clé API Groq enregistrée avec succès pour le chatbot Telegram !</blockquote>', { parse_mode: 'HTML' });
    });

    // Commande textuelle : /chatbot on ou /chatbot off
    bot.command('chatbot', async (ctx) => {
        if (ctx.chat.type === 'private') {
            return ctx.reply('<blockquote>❌ Cette commande s\'utilise uniquement dans un groupe.</blockquote>', { parse_mode: 'HTML' });
        }
        
        if (!(await checkAdmin(ctx))) {
            return ctx.reply('<blockquote>❌ Seuls les administrateurs du groupe peuvent configurer le chatbot.</blockquote>', { parse_mode: 'HTML', reply_to_message_id: ctx.message?.message_id });
        }

        const chatId = String(ctx.chat.id);
        const db = loadDb(dbPath, []);
        const args = ctx.message.text.split(' ')[1]?.toLowerCase();

        if (args === 'on') {
            if (!db.includes(chatId)) {
                db.push(chatId);
                saveDb(dbPath, db);
            }
            return ctx.reply('<blockquote>🤖 Chatbot IA (mode ado) activé pour ce groupe ! Mentionne-moi pour discuter.</blockquote>', { parse_mode: 'HTML' });
        } else if (args === 'off') {
            const index = db.indexOf(chatId);
            if (index > -1) {
                db.splice(index, 1);
                saveDb(dbPath, db);
            }
            return ctx.reply('<blockquote>🤖 Chatbot désactivé pour ce groupe.</blockquote>', { parse_mode: 'HTML' });
        } else {
            const status = db.includes(chatId) ? '✅ Activé' : '❌ Désactivé';
            return ctx.reply(`<blockquote>🤖 <b>État du Chatbot :</b> ${status}\n\nUtilise <code>/chatbot on</code> ou <code>/chatbot off</code>.</blockquote>`, { parse_mode: 'HTML' });
        }
    });

    // Actions des boutons interactifs (Activer / Désactiver via le menu)
    bot.action('chatbot_on', async (ctx) => {
        await ctx.answerCbQuery();
        if (ctx.chat?.type === 'private') {
            return ctx.reply('<blockquote>❌ Cette action doit être faite depuis un groupe.</blockquote>', { parse_mode: 'HTML' });
        }
        if (!(await checkAdmin(ctx))) {
            return ctx.reply('<blockquote>❌ Réservé aux administrateurs du groupe.</blockquote>', { parse_mode: 'HTML' });
        }

        const chatId = String(ctx.chat.id);
        const db = loadDb(dbPath, []);
        if (!db.includes(chatId)) {
            db.push(chatId);
            saveDb(dbPath, db);
        }
        await ctx.reply('<blockquote>✅ Chatbot IA activé avec succès pour ce groupe !</blockquote>', { parse_mode: 'HTML' });
    });

    bot.action('chatbot_off', async (ctx) => {
        await ctx.answerCbQuery();
        if (ctx.chat?.type === 'private') {
            return ctx.reply('<blockquote>❌ Cette action doit être faite depuis un groupe.</blockquote>', { parse_mode: 'HTML' });
        }
        if (!(await checkAdmin(ctx))) {
            return ctx.reply('<blockquote>❌ Réservé aux administrateurs du groupe.</blockquote>', { parse_mode: 'HTML' });
        }

        const chatId = String(ctx.chat.id);
        const db = loadDb(dbPath, []);
        const index = db.indexOf(chatId);
        if (index > -1) {
            db.splice(index, 1);
            saveDb(dbPath, db);
        }
        await ctx.reply('<blockquote>❌ Chatbot IA désactivé pour ce groupe.</blockquote>', { parse_mode: 'HTML' });
    });

    // Écouteur des messages du groupe pour répondre via l'API Groq
    bot.on('text', async (ctx, next) => {
        try {
            if (ctx.chat.type === 'private') return next();

            const chatId = String(ctx.chat.id);
            const db = loadDb(dbPath, []);
            if (!db.includes(chatId)) return next();

            const message = ctx.message;
            const botUsername = ctx.botInfo?.username;
            const text = message.text || '';
            
            const isTagged = botUsername && text.includes(`@${botUsername}`);
            const isReplyToBot = message.reply_to_message && message.reply_to_message.from?.id === ctx.botInfo?.id;

            if (isTagged || isReplyToBot) {
                const cleanQuery = text.replace(new RegExp(`@${botUsername}`, 'gi'), '').trim();
                if (!cleanQuery) return next();

                const keyData = loadDb(apiKeyPath, { key: '' });
                const apiKey = keyData.key;

                if (!apiKey) {
                    await ctx.reply('<blockquote>⚠️ L\'administrateur n\'a pas configuré la clé API Groq avec <code>/setgroqkey</code>.</blockquote>', { parse_mode: 'HTML', reply_to_message_id: message.message_id });
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
