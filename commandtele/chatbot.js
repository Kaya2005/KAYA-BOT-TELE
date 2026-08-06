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

export default function setupChatbot(bot) {
    // Commande pour configurer la clé API Groq (Réservé aux admins du bot)
    bot.command('setgroqkey', async (ctx) => {
        const text = ctx.message.text.split(' ')[1];
        if (!text) {
            return ctx.reply('<blockquote>⚠️ Utilisation : <code>/setgroqkey gsk_...</code></blockquote>', { parse_mode: 'HTML' });
        }
        saveDb(apiKeyPath, { key: text });
        return ctx.reply('<blockquote>✅ Clé API Groq enregistrée avec succès pour le chatbot Telegram !</blockquote>', { parse_mode: 'HTML' });
    });

    // Commande pour activer ou désactiver le chatbot dans un groupe (Réservé aux administrateurs du groupe)
    bot.command('chatbot', async (ctx) => {
        if (ctx.chat.type === 'private') {
            return ctx.reply('<blockquote>❌ Cette commande s\'utilise uniquement dans un groupe.</blockquote>', { parse_mode: 'HTML' });
        }
        
        // 🛡️ Vérification des privilèges administrateur
        try {
            const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
            if (!['creator', 'administrator'].includes(member.status)) {
                return ctx.reply('<blockquote>❌ Seuls les administrateurs du groupe peuvent activer ou désactiver le chatbot.</blockquote>', { 
                    parse_mode: 'HTML', 
                    reply_to_message_id: ctx.message?.message_id 
                });
            }
        } catch (e) {
            return ctx.reply('<blockquote>❌ Impossible de vérifier vos privilèges d\'administrateur.</blockquote>', { 
                parse_mode: 'HTML', 
                reply_to_message_id: ctx.message?.message_id 
            });
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
            return ctx.reply(`<blockquote>🤖 <b>État du Chatbot :</b> ${status}\n\nUtilise <code>/chatbot on</code> ou <code>/chatbot off</code> pour le configurer (Réservé aux admins).</blockquote>`, { parse_mode: 'HTML' });
        }
    });

    // Écouteur pour intercepter les messages du groupe et répondre via l'API Groq avec un style ado
    bot.on('text', async (ctx, next) => {
        try {
            if (ctx.chat.type === 'private') return next();

            const chatId = String(ctx.chat.id);
            const db = loadDb(dbPath, []);
            if (!db.includes(chatId)) return next();

            const message = ctx.message;
            const botUsername = ctx.botInfo?.username;
            const text = message.text || '';
            
            // Vérifie si le bot est tagué (@username) ou s'il s'agit d'une réponse directe à son message
            const isTagged = botUsername && text.includes(`@${botUsername}`);
            const isReplyToBot = message.reply_to_message && message.reply_to_message.from?.id === ctx.botInfo?.id;

            if (isTagged || isReplyToBot) {
                const cleanQuery = text.replace(new RegExp(`@${botUsername}`, 'gi'), '').trim();
                if (!cleanQuery) return next();

                const keyData = loadDb(apiKeyPath, { key: '' });
                const apiKey = keyData.key;

                if (!apiKey) {
                    await ctx.reply('<blockquote>⚠️ L\'administrateur n\'a pas encore configuré la clé API Groq avec <code>/setgroqkey</code>.</blockquote>', { parse_mode: 'HTML', reply_to_message_id: message.message_id });
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
