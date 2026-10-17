// ==================== botname.js ====================
import { setSetting, getSetting } from '../setting.js';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';
import { getString } from '../setting/language.js';

export default {
    name: 'botname',
    category: 'System',
    description: 'Change the bot name for the user.',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        const newName = args.join(' ').trim();
        
        // Récupération sécurisée de l'ID du propriétaire du bot
        const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
        if (!ownerId) {
            return await kaya.sendMessage(from, { text: `❌ ${getString(ownerId, 'botNameOwnerError')}` }, { quoted: mek });
        }
        
        // On récupère le nom actuel configuré pour le propriétaire
        const currentName = getBotName(ownerId);
        
        if (!newName) {
            return await kaya.sendMessage(from, { 
                text: `⚠️ ${getString(ownerId, 'botNameProvideNew')}\n${getString(ownerId, 'botNameCurrent')}: *${currentName}*` 
            }, { quoted: mek });
        }

        try {
            // Sauvegarde le nom spécifiquement pour l'ID du propriétaire
            await setSetting(ownerId, 'botName', newName);

            const now = new Date();
            const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const date = now.toLocaleDateString('en-GB');

            const caption = `
▉ \`${newName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*⏱️ : ${time} • GMT*
*📅 : ${date}*
*✅ STATUS : ${getString(ownerId, 'botNameUpdatedStatus')}*
______________________

${getString(ownerId, 'botNameSuccessMsg')}
`.trim();

            // Envoi avec l'image dynamique et passage de ownerId
            await sendWithBotImage(kaya, from, ownerId, {
                caption: caption,
                contextInfo: getContextInfo(ownerId)
            });

        } catch (err) {
            console.error('❌ Error in botname.js:', err);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            await kaya.sendMessage(from, { text: `❌ ${getString(ownerId, 'botNameSaveError')}` }, { quoted: mek });
        }
    }
};
