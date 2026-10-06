//ban.js
import { getSetting, setSetting } from '../setting.js';
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';

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
                const menuContent = 
                    `• \`${prefix}ban @ᴍᴇɴᴛɪᴏɴ\`\n` +
                    `• \`${prefix}ban <ɴᴜᴍʙᴇʀ>\``;

                return await kaya.sendMessage(from, { 
                    text: boxMessage('ban user menu', menuContent, '🚫') 
                }, { quoted: mek });
            }

            // Vérification du bannissement via le système de setting (stocké dans le dossier du propriétaire)
            const isBanned = getSetting(ownerId, `banned_${target}`, false);
            
            if (isBanned) {
                return await kaya.sendMessage(from, { 
                    text: boxMessage('ban system', 'ᴜsᴇʀ ɪs ᴀʟʀᴇᴀᴅʏ ʙᴀɴɴᴇᴅ.', '⚠️') 
                }, { quoted: mek });
            }

            // Enregistrement du bannissement
            setSetting(ownerId, `banned_${target}`, true);

            const successContent = `ᴜsᴇʀ @${target.split('@')[0]} ʜᴀs ʙᴇᴇɴ ʙᴀɴɴᴇᴅ.`;
            await kaya.sendMessage(from, { 
                text: successBox(successContent), 
                mentions: [target] 
            }, { quoted: mek });
        } catch (err) {
            console.error('❌ Ban command error:', err);
            await kaya.sendMessage(from, { 
                text: errorBox(`ᴄᴏᴜʟᴅ ɴᴏᴛ ʙᴀɴ ᴜsᴇʀ : ${err.message}`) 
            }, { quoted: mek });
        }
    }
};
