// botimage.js
import fs from 'fs';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { getBotName, sendWithBotImage, getLocalBotImagePath } from '../setting/botAssets.js';
import { usageBox, successBox, errorBox } from '../setting/theme.js';
import { getString } from '../setting/language.js';

export default {
    name: 'botimage',
    alias: ['setbotimage', 'changeimage'],
    description: 'Changes your own bot\'s image by replying to an image',
    category: 'System',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Récupération sécurisée de l'ID du propriétaire du bot
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            if (!ownerId) {
                return await kaya.sendMessage(from, { text: errorBox(getString(ownerId, 'botImageOwnerError')) }, { quoted: mek });
            }

            const quoted = mek.quoted;
            const isQuotedImage = quoted && (quoted.mtype === 'imageMessage' || quoted.type === 'imageMessage');

            if (!isQuotedImage) {
                return await kaya.sendMessage(from, { text: usageBox(prefix, 'botimage', getString(ownerId, 'botImageReplyInstruction')) }, { quoted: mek });
            }

            await kaya.sendMessage(from, { text: `⏳ *${getString(ownerId, 'botImageDownloading')}*` }, { quoted: mek });

            const stream = await downloadMediaMessage(
                { message: { imageMessage: quoted } }, 
                'buffer', 
                {}, 
                { logger: console }
            );

            if (!stream) {
                return await kaya.sendMessage(from, { text: errorBox(getString(ownerId, 'botImageDownloadFailed')) }, { quoted: mek });
            }

            // Enregistrement de l'image dans le dossier de l'owner
            const userImagePath = getLocalBotImagePath(ownerId);
            fs.writeFileSync(userImagePath, stream);

            const successText = successBox(getString(ownerId, 'botImageSuccess'));

            return await sendWithBotImage(kaya, from, ownerId, { caption: successText });

        } catch (err) {
            console.error('❌ botimage.js error:', err);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            return await kaya.sendMessage(from, { text: errorBox(`${getString(ownerId, 'botImageUnexpectedError')} : ${err.message}`) }, { quoted: mek });
        }
    }
};
