// autoreactch.js
import { getSetting, setSetting } from '../setting.js';
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';
import { getString } from '../setting/language.js';

const RANDOM_EMOJIS = ['❤️','😂','🎉','👍','🔥','😮','👏','🎊','🤯','😍','🥰','😎','🤩','💯','✨','🌟','💖','💕','💙','💚','💛','💜','🖤','🤍','🧡','😊','😇','🥳','😋','😜','🤪','🤗','🤭'];
const getRandomEmoji = () => RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)];
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
    name: 'autoreactch',
    category: 'Owner',
    description: 'Réagir automatiquement à une publication spécifique d\'une chaîne via son lien',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            const inputLink = args[0]; // Le lien de l'actu ex: https://whatsapp.com/channel/CODE/ID

            if (!inputLink || !inputLink.includes('whatsapp.com/channel/')) {
                const usageContent = 
                    `• Utilisez le lien de l'actualité de la chaîne :\n` +
                    `\`${prefix}autoreactch https://whatsapp.com/channel/CODE/ID_MESSAGE\`\n\n` +
                    `*Exemple :*\n` +
                    `\`${prefix}autoreactch https://whatsapp.com/channel/0029Vb8GO1G9hXFAF1Taqr0q/104\``;

                return kaya.sendMessage(from, { 
                    text: boxMessage('REACTION CIBLÉE - CHAÎNE', usageContent, '🔗') 
                }, { quoted: mek });
            }

            // Nettoyage et découpage propre du lien
            const cleanLink = inputLink.trim();
            const urlObj = new URL(cleanLink.startsWith('http') ? cleanLink : `https://${cleanLink}`);
            const pathSegments = urlObj.pathname.split('/').filter(Boolean); 
            // pathSegments devrait contenir ['channel', 'CODE', 'ID']

            const channelCode = pathSegments[1]; // Le code d'invitation de la chaîne
            const messageId = pathSegments[2];   // L'ID numérique du message

            if (!channelCode || !messageId || isNaN(messageId)) {
                return kaya.sendMessage(from, { 
                    text: errorBox('Lien invalide. Assurez-vous d\'utiliser le lien complet de l\'actualité.') 
                }, { quoted: mek });
            }

            await kaya.sendMessage(from, { text: successBox(`⏳ Résolution et ciblage de la chaîne pour l'actualité ID : ${messageId}...`) }, { quoted: mek });

            await delay(1000);

            // 📌 Étape clé : Obtenir le JID de la newsletter à partir du code d'invitation
            let targetJid = from;
            if (!targetJid.endsWith('@newsletter')) {
                try {
                    const newsletterInfo = await kaya.newsletterMetadata("invite", channelCode);
                    if (newsletterInfo && newsletterInfo.id) {
                        targetJid = newsletterInfo.id;
                    } else {
                        targetJid = `${channelCode}@newsletter`;
                    }
                } catch (e) {
                    // Fallback si la métadonnée échoue
                    targetJid = `${channelCode}@newsletter`;
                }
            }

            const emoji = getRandomEmoji();
            
            const reactionKey = {
                remoteJid: targetJid,
                id: messageId,
                fromMe: false
            };

            await kaya.sendMessage(targetJid, { 
                react: { 
                    text: emoji, 
                    key: reactionKey 
                } 
            });

            return kaya.sendMessage(from, { 
                text: successBox(`✅ Réaction (${emoji}) envoyée avec succès sur l'actualité ${messageId} !`) 
            }, { quoted: mek });

        } catch (err) { 
            console.error('❌ autoreactch error:', err);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            await kaya.sendMessage(from, { 
                text: errorBox('Une erreur est survenue lors de la tentative de réaction sur la chaîne.') 
            }, { quoted: mek });
        }
    }
};
