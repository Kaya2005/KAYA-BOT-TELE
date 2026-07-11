import axios from 'axios';
import { setBotImageForUser } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
    name: 'setbotimage',
    category: 'Owner',
    description: 'Change your custom bot image for your profile.',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        const url = args[0];
        const senderJid = mek.sender;

        // Validation de l'URL
        if (!url || !url.startsWith('http')) {
            return await kaya.sendMessage(from, { 
                text: `❌ Please provide a valid image link.\nExample: ${prefix}setbotimage https://files.catbox.moe/s42m2j.jpg`,
                contextInfo: getContextInfo() 
            }, { quoted: mek });
        }

        try {
            // Vérification que le lien est bien une image
            const res = await axios.get(url, { responseType: 'arraybuffer' });
            const contentType = res.headers['content-type'];

            if (!contentType || !contentType.startsWith('image/')) {
                return await kaya.sendMessage(from, { 
                    text: '❌ The provided link does not contain a valid image.',
                    contextInfo: getContextInfo() 
                }, { quoted: mek });
            }

            // Enregistrement spécifique à l'utilisateur
            setBotImageForUser(senderJid, url);

            await kaya.sendMessage(from, { 
                text: '✅ Your custom bot image has been updated successfully!',
                contextInfo: getContextInfo() 
            }, { quoted: mek });

        } catch (err) {
            console.error('❌ setbotimage error:', err);
            await kaya.sendMessage(from, { 
                text: '❌ Unable to change the bot image. Check the link or try again.',
                contextInfo: getContextInfo() 
            }, { quoted: mek });
        }
    }
};
