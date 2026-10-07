import fs from 'fs';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { getBotName, sendWithBotImage, getLocalBotImagePath } from '../setting/botAssets.js';
import { usageBox, successBox, errorBox } from '.../setting/theme.js';

export default {
    name: 'botimage',
    alias: ['setbotimage', 'changeimage'],
    description: 'Changes your own bot\'s image by replying to an image',
    category: 'System',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Récupération sécurisée de l'ID du propriétaire du bot
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
            if (!ownerId) {
                return await kaya.sendMessage(from, { text: errorBox('Impossible to retrieve the owner ID.') }, { quoted: mek });
            }

            const quoted = mek.quoted;
            const isQuotedImage = quoted && (quoted.mtype === 'imageMessage' || quoted.type === 'imageMessage');

            if (!isQuotedImage) {
                const content = `*Direct Commands:*\n• Reply to an image with\n  \`${prefix}botimage\``;
                return await kaya.sendMessage(from, { text: usageBox(prefix, 'botimage', 'reply to an image') }, { quoted: mek });
            }

            await kaya.sendMessage(from, { text: "⏳ *Downloading and updating your custom image...*" }, { quoted: mek });

            const stream = await downloadMediaMessage(
                { message: { imageMessage: quoted } }, 
                'buffer', 
                {}, 
                { logger: console }
            );

            if (!stream) {
                return await kaya.sendMessage(from, { text: errorBox('Failed to download the image.') }, { quoted: mek });
            }

            // Enregistrement de l'image dans le dossier de l'owner
            const userImagePath = getLocalBotImagePath(ownerId);
            fs.writeFileSync(userImagePath, stream);

            const successText = successBox('Your new bot image has been successfully saved!');

            return await sendWithBotImage(kaya, from, ownerId, { caption: successText });

        } catch (err) {
            console.error('❌ botimage.js error:', err);
            return await kaya.sendMessage(from, { text: errorBox(`Unexpected error: ${err.message}`) }, { quoted: mek });
        }
    }
};
