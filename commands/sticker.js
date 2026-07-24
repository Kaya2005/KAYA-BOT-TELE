import { addExif } from '../lib/sticker.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { StickerTypes } from 'wa-sticker-formatter';

export default {
    name: 'sticker',
    alias: ['s', 'stiker', 'stick'],
    description: 'Convert image or video to sticker',
    category: 'Sticker',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const quoted = mek.quoted ? mek.quoted : mek;
            const mime = (quoted.msg || quoted).mimetype || '';

            if (!/image|video/.test(mime)) {
                return await kaya.sendMessage(from, { text: '⚠️ Reply to an image or video.' }, { quoted: mek });
            }

            const media = await downloadContentFromMessage(quoted, mime.split('/')[0]);
            let buffer = Buffer.alloc(0);
            for await (const chunk of media) buffer = Buffer.concat([buffer, chunk]);

            const stickerOptions = {
                packname: 'KAYA-MD',
                author: 'kaya-tech',
                type: /video/.test(mime) ? StickerTypes.ANIMATED : StickerTypes.FULL
            };

            const stickerBuffer = await addExif(buffer, stickerOptions);

            await kaya.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

        } catch (err) {
            console.error('❌ Sticker error:', err);
            await kaya.sendMessage(from, { text: '❌ Failed to create sticker.' }, { quoted: mek });
        }
    }
};
