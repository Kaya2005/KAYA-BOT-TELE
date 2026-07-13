import { getSetting, setSetting } from '../setting.js';

export default {
    name: 'ban',
    description: '🚫 Ban a user from the bot',
    category: 'Owner',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            // ID du propriétaire de l'instance pour stocker la config au bon endroit
            const ownerId = kaya.user.id.split(':')[0];
            let target;

            // Récupération de la cible
            if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
                target = mek.message.extendedTextMessage.contextInfo.participant;
            } else if (args[0]) {
                target = args[0].replace(/\D/g, '') + '@s.whatsapp.net';
            }

            if (!target) {
                return await kaya.sendMessage(from, { text: `⚠️ Please mention, reply or provide a number.\nUsage: ${prefix}ban @mention` }, { quoted: mek });
            }

            // Vérification du bannissement via le système de setting (stocké dans le dossier du propriétaire)
            // On utilise une clé spécifique 'banned_user' pour éviter les conflits
            const isBanned = getSetting(ownerId, `banned_${target}`, false);
            
            if (isBanned) {
                return await kaya.sendMessage(from, { text: '⚠️ User is already banned.' }, { quoted: mek });
            }

            // Enregistrement du bannissement
            setSetting(ownerId, `banned_${target}`, true);

            await kaya.sendMessage(from, { text: `✅ User ${target.split('@')[0]} has been banned.` }, { quoted: mek });
        } catch (err) {
            console.error('❌ Ban command error:', err);
            await kaya.sendMessage(from, { text: '❌ Could not ban user.' }, { quoted: mek });
        }
    }
};
