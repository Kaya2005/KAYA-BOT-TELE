import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

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
            const botName = getBotName(ownerId);
            const quoted = mek.quoted;
            const isQuotedImage = quoted && (quoted.mtype === 'imageMessage' || quoted.type === 'imageMessage');

            if (!isQuotedImage) {
                const text = `❌ Please reply to an **image** with the command:\n*${prefix}groupimage*`;
                return await kaya.sendMessage(from, { text }, { quoted: mek });
            }

            await kaya.sendMessage(from, { text: "⏳ Downloading and updating the group image..." }, { quoted: mek });

            const stream = await downloadMediaMessage(
                { message: { imageMessage: quoted } }, 
                'buffer', 
                {}, 
                { logger: console }
            );

            if (!stream) {
                return await kaya.sendMessage(from, { text: "❌ Failed to download the image." }, { quoted: mek });
            }

            // Updates the group's profile picture
            await kaya.updateProfilePicture(from, stream);

            const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*✅ GROUP IMAGE UPDATED*\n*➡️ The group profile picture has been successfully updated!*`;

            return await sendWithBotImage(kaya, from, ownerId, { caption, contextInfo: getContextInfo(ownerId) });

        } catch (err) {
            console.error('❌ groupimage.js error:', err);
            return await kaya.sendMessage(from, { text: `❌ An error occurred: ${err.message}` }, { quoted: mek });
        }
    }
};
