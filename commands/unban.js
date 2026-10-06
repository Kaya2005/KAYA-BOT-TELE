import { setSetting, getSetting } from '../setting.js';

export default {
    name: 'unban',
    description: '✅ Unban a user from the bot',
    category: 'Owner',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            // ID du propriétaire pour accéder au bon fichier settings.json
            const ownerId = kaya.user.id.split(':')[0];
            let target;

            // 1️⃣ Récupération de la cible
            if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
                target = mek.message.extendedTextMessage.contextInfo.participant;
            } else if (args[0]) {
                target = args[0].replace(/\D/g, '') + '@s.whatsapp.net';
            }

            if (!target) {
                return await kaya.sendMessage(from, { text: `⚠️ Please mention, reply or provide a number to unban.\nUsage: ${prefix}unban @mention` }, { quoted: mek });
            }

            // 2️⃣ Vérification du bannissement via la clé spécifique 'banned_{target}'
            const isBanned = getSetting(ownerId, `banned_${target}`, false);
            
            if (!isBanned) {
                return await kaya.sendMessage(from, { text: '⚠️ User is not currently banned.' }, { quoted: mek });
            }

            // 3️⃣ Mise à jour du setting (débannissement)
            setSetting(ownerId, `banned_${target}`, false);

            await kaya.sendMessage(from, { text: `✅ User ${target.split('@')[0]} has been unbanned.` }, { quoted: mek });
        } catch (err) {
            console.error('❌ Unban command error:', err);
            await kaya.sendMessage(from, { text: '❌ Could not unban user.' }, { quoted: mek });
        }
    }
};
