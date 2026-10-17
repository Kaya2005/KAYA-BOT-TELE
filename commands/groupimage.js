// ppgroup.js
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';
import { usageBox, successBox, errorBox, boxMessage } from '../setting/theme.js';
import { getString } from '../setting/language.js';

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
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            const quoted = mek.quoted;
            const isQuotedImage = quoted && (quoted.mtype === 'imageMessage' || quoted.type === 'imageMessage');

            if (!isQuotedImage) {
                return await kaya.sendMessage(from, { text: usageBox(prefix, 'ppgroup', getString(ownerId, 'ppGroupReplyInstruction')) }, { quoted: mek });
            }

            await kaya.sendMessage(from, { text: `⏳ *${getString(ownerId, 'ppGroupDownloading')}*` }, { quoted: mek });

            const stream = await downloadMediaMessage(
                { message: { imageMessage: quoted } }, 
                'buffer', 
                {}, 
                { logger: console }
            );

            if (!stream) {
                return await kaya.sendMessage(from, { text: errorBox(getString(ownerId, 'ppGroupDownloadFailed')) }, { quoted: mek });
            }

            // Updates the group's profile picture
            await kaya.updateProfilePicture(from, stream);

            const content = `*➡️ ${getString(ownerId, 'ppGroupSuccessContent')}*`;
            const caption = boxMessage(getString(ownerId, 'ppGroupSuccessTitle'), content, '✅');

            return await sendWithBotImage(kaya, from, ownerId, { caption, contextInfo: getContextInfo(ownerId + '@s.whatsapp.net') });

        } catch (err) {
            console.error('❌ groupimage.js error:', err);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            return await kaya.sendMessage(from, { text: errorBox(`${getString(ownerId, 'ppGroupError')} : ${err.message}`) }, { quoted: mek });
        }
    }
};
