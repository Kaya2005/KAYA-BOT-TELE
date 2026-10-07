import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';
import { usageBox, successBox, errorBox, boxMessage } from '../setting/theme.js';

export default {
    name: 'ppgroup',
    alias: ['setgroupimage', 'gimage'],
    description: 'Changes the group profile picture by replying to an image',
    category: 'Group',
    group: true,
    admin: true,
    botAdmin: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user.id.split(':')[0];
            const quoted = mek.quoted;
            const isQuotedImage = quoted && (quoted.mtype === 'imageMessage' || quoted.type === 'imageMessage');

            if (!isQuotedImage) {
                return await kaya.sendMessage(from, { text: usageBox(prefix, 'ppgroup', 'reply to an image') }, { quoted: mek });
            }

            await kaya.sendMessage(from, { text: "⏳ *Downloading and updating the group image...*" }, { quoted: mek });

            const stream = await downloadMediaMessage(
                { message: { imageMessage: quoted } }, 
                'buffer', 
                {}, 
                { logger: console }
            );

            if (!stream) {
                return await kaya.sendMessage(from, { text: errorBox('Failed to download the image.') }, { quoted: mek });
            }

            // Updates the group's profile picture
            await kaya.updateProfilePicture(from, stream);

            const content = `*➡️ The group profile picture has been successfully updated!*`;
            const caption = boxMessage('Group Image Updated', content, '✅');

            return await sendWithBotImage(kaya, from, ownerId, { caption, contextInfo: getContextInfo(ownerId) });

        } catch (err) {
            console.error('❌ groupimage.js error:', err);
            return await kaya.sendMessage(from, { text: errorBox(`An error occurred: ${err.message}`) }, { quoted: mek });
        }
    }
};
