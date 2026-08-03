import fetch from 'node-fetch';
import { getSetting, setSetting } from '../setting.js';

export default {
    name: 'ai',
    description: '🤖 Pose une question à l\'intelligence artificielle (Groq)',
    category: 'IA',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // 1. Récupération propre de l'ID du bot
            const botId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

            // 2. Identification correcte de l'expéditeur
            const senderJid = mek.sender || mek.key.participant || mek.key.remoteJid || '';
            const senderId = senderJid.split(':')[0].replace(/[^0-9]/g, '');

            // 3. Vérification si l'expéditeur est le propriétaire
            const isOwner = senderId === botId;

            // 4. Gestion de l'enregistrement de la clé
            if (args[0] === 'setkey') {
                if (!isOwner) {
                    return await kaya.sendMessage(from, { 
                        text: `*❌ Seul le propriétaire de ce bot peut configurer la clé API.*` 
                    }, { quoted: mek });
                }

                const customKey = args[1];
                if (!customKey) {
                    return await kaya.sendMessage(from, { 
                        text: `*❌ Veuillez fournir votre clé API Groq.*\n\nExemple : \`${prefix}ai setkey gsk_...\`` 
                    }, { quoted: mek });
                }
                
                await setSetting(botId, 'ai_api_key', customKey);
                return await kaya.sendMessage(from, { 
                    text: `*✅ Clé API Groq enregistrée avec succès pour votre bot !*` 
                }, { quoted: mek });
            }

            // 5. Gestion de la suppression de la clé
            if (args[0] === 'delkey') {
                if (!isOwner) {
                    return await kaya.sendMessage(from, { 
                        text: `*❌ Seul le propriétaire de ce bot peut supprimer cette configuration.*` 
                    }, { quoted: mek });
                }

                await setSetting(botId, 'ai_api_key', null);
                return await kaya.sendMessage(from, { 
                    text: `*🗑️ Clé API personnalisée supprimée.*` 
                }, { quoted: mek });
            }

            // 6. Vérification si la clé est configurée
            const ownerApiKey = getSetting(botId, 'ai_api_key', null);

            if (!ownerApiKey) {
                if (isOwner) {
                    const guideText = `*⚠️ Clé API Groq non configurée*\n\n` +
                        `En tant que propriétaire, vous devez configurer une clé API Groq gratuite pour activer l'assistant.\n\n` +
                        `🌐 *Comment générer votre clé API gratuitement :*\n` +
                        `1. Rendez-vous sur [Groq Console](https://console.groq.com/)\n` +
                        `2. Connectez-vous (compte Google ou GitHub).\n` +
                        `3. Allez dans **API Keys** et créez une nouvelle clé (\`gsk_...\`).\n` +
                        `4. Copiez la clé.\n\n` +
                        `⚙️ *Enregistrez-la ensuite dans le bot avec la commande :*\n` +
                        `\`${prefix}ai setkey <votre_clé>\``;

                    return await kaya.sendMessage(from, { text: guideText }, { quoted: mek });
                } else {
                    return await kaya.sendMessage(from, { 
                        text: `*❌ Le propriétaire n'a pas encore configuré son API IA.*` 
                    }, { quoted: mek });
                }
            }

            const text = args.join(' ').trim();

            if (!text) {
                return await kaya.sendMessage(from, { 
                    text: `*❌ Utilisation incorrecte.*\n\nExemple : \`${prefix}ai C'est quoi Node.js ?\`` 
                }, { quoted: mek });
            }

            // Message de chargement
            await kaya.sendMessage(from, { 
                text: '⏳ *Réflexion en cours...* 🤖' 
            }, { quoted: mek });

            // Utilisation de l'API Groq (Modèle Llama 3.3)
            const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ownerApiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'user', content: text }
                    ]
                })
            });

            const json = await apiResponse.json();
            
            let answer = "";
            if (json.choices && json.choices[0]?.message?.content) {
                answer = json.choices[0].message.content;
            } else {
                answer = json.error?.message || "Désolé, une erreur est survenue lors de la communication avec l'IA.";
            }

            const message = `🤖 *KAYA AI ASSISTANT (Groq)*\n\n${answer}`;
            await kaya.sendMessage(from, { text: message }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans ai.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ Une erreur est survenue lors de la communication avec l’intelligence artificielle.' }, { quoted: mek });
        }
    }
};
