import fetch from 'node-fetch';
import { getSetting, setSetting } from '../setting.js';

export default {
    name: 'ai',
    description: '🤖 Pose une question à l\'intelligence artificielle (Gemini)',
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
                        text: `*❌ Veuillez fournir votre clé API Google Gemini.*\n\nExemple : \`${prefix}ai setkey AIzaSy...\`` 
                    }, { quoted: mek });
                }
                
                await setSetting(botId, 'ai_api_key', customKey);
                return await kaya.sendMessage(from, { 
                    text: `*✅ Clé API Google Gemini enregistrée avec succès pour votre bot !*` 
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
                    const guideText = `*⚠️ Clé API Google Gemini non configurée*\n\n` +
                        `En tant que propriétaire de ce bot, vous devez configurer une clé API Google Gemini pour activer l'assistant.\n\n` +
                        `🌐 *Comment générer votre clé API gratuitement :*\n` +
                        `1. Rendez-vous sur [Google AI Studio](https://aistudio.google.com/)\n` +
                        `2. Connectez-vous avec votre compte Google.\n` +
                        `3. Cliquez sur **"Get API key"** (Créer une clé API).\n` +
                        `4. Copiez la clé générée.\n\n` +
                        `⚙️ *Enregistrez-la ensuite dans le bot avec la commande :*\n` +
                        `\`${prefix}ai setkey <votre_clé>\``;

                    return await kaya.sendMessage(from, { text: guideText }, { quoted: mek });
                } else {
                    return await kaya.sendMessage(from, { 
                        text: `*❌ Le propriétaire n'a pas encore configuré son API Google Gemini.*` 
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

            // Utilisation du modèle gemini-1.5-flash (plus stable sur les quotas gratuits)
            const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${ownerApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: text }] }]
                })
            });

            const json = await apiResponse.json();
            
            let answer = "";
            if (json.candidates && json.candidates[0]?.content?.parts?.[0]?.text) {
                answer = json.candidates[0].content.parts[0].text;
            } else {
                answer = json.error?.message || "Désolé, une erreur est survenue lors de la communication avec l'IA.";
            }

            const message = `🤖 *KAYA AI ASSISTANT (Gemini)*\n\n${answer}`;
            await kaya.sendMessage(from, { text: message }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans ai.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ Une erreur est survenue lors de la communication avec l’intelligence artificielle.' }, { quoted: mek });
        }
    }
};
