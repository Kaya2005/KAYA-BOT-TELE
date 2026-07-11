import { setSetting } from '../setting.js';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
    name: 'botname',
    category: 'Owner',
    description: 'Change the bot name for the user.',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        const newName = args.join(' ');
        
        // On utilise mek.sender pour que le nom soit lié à l'utilisateur
        const senderJid = mek.sender;
        
        // On récupère le nom actuel configuré pour cet utilisateur
        const currentName = getBotName(senderJid);
        
        if (!newName) {
            return await kaya.sendMessage(from, { 
                text: `⚠️ Please provide a new name.\nCurrent name for your profile: *${currentName}*` 
            }, { quoted: mek });
        }

        try {
            // Sauvegarde le nom spécifiquement pour le JID de l'utilisateur
            setSetting(senderJid, 'botName', newName);

            const now = new Date();
            const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const date = now.toLocaleDateString('en-GB');

            const caption = `
▉ \`${newName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*⏱️ : ${time} • GMT*
*📅 : ${date}*
*✅ STATUS : NAME UPDATED*
______________________

Bot name successfully updated for your profile!
`.trim();

            // Envoi avec l'image dynamique (Mise à jour : ajout de senderJid comme 3ème argument)
            await sendWithBotImage(kaya, from, senderJid, {
                caption: caption,
                contextInfo: getContextInfo()
            });

        } catch (err) {
            console.error('❌ Error in botname.js:', err);
            await kaya.sendMessage(from, { text: '❌ Error while saving the new name.' }, { quoted: mek });
        }
    }
};
