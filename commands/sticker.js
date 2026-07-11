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
            // 1. Détection correcte du média (image ou vidéo)
            const isQuoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const message = isQuoted ? (mek.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage || mek.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage || mek.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage) : (mek.message.imageMessage || mek.message.videoMessage);
            const type = Object.keys(isQuoted ? mek.message.extendedTextMessage.contextInfo.quotedMessage : mek.message)[0];
            const mime = isQuoted ? (mek.message.extendedTextMessage.contextInfo.quotedMessage[type].mimetype) : (mek.message[type].mimetype);

            if (!/image|video|sticker/.test(mime)) {
                return await kaya.sendMessage(from, { text: '⚠️ Réponds à une image, une vidéo ou un sticker.' }, { quoted: mek });
            }

            // 2. Téléchargement plus robuste
            const stream = await downloadContentFromMessage(message, type.replace('Message', ''));
            let buffer = Buffer.alloc(0);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            // 3. Préparation des options
            const stickerOptions = {
                packname: 'KAYA-MD',
                author: 'kaya-tech',
                type: /video/.test(mime) ? StickerTypes.ANIMATED : StickerTypes.FULL
            };

            // 4. Création avec ton lib/sticker.js
            const stickerBuffer = await addExif(buffer, stickerOptions);

            await kaya.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

        } catch (err) {
            console.error('❌ Sticker error:', err);
            await kaya.sendMessage(from, { text: '❌ Échec lors de la création du sticker.' }, { quoted: mek });
        }
    }
};
