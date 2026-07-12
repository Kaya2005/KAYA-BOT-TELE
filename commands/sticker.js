import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export default {
    name: 'sticker',
    alias: ['s', 'stiker', 'stick'],
    description: 'Convert media to sticker',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const mediaMsg = mek.message?.imageMessage || mek.message?.videoMessage || 
                             quoted?.imageMessage || quoted?.videoMessage;

            if (!mediaMsg) {
                return kaya.sendMessage(from, { text: `⚠️ *Usage:* Réponds à une image ou une vidéo avec ${prefix}sticker` }, { quoted: mek });
            }

            await kaya.sendPresenceUpdate('composing', from);

            const type = mediaMsg.mimetype?.includes('video') ? 'video' : 'image';
            const stream = await downloadContentFromMessage(mediaMsg, type);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const buffer = Buffer.concat(chunks);

            // Utilisation de wa-sticker-formatter pour créer un sticker valide
            const sticker = new Sticker(buffer, {
                pack: 'Kaya Bot', // Nom du pack
                author: 'Kaya',    // Nom de l'auteur
                type: StickerTypes.FULL, // FULL remplit le cadre, CROPPED le centre
                quality: 50
            });

            const stickerBuffer = await sticker.toBuffer();

            await kaya.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

        } catch (error) {
            console.error('❌ Sticker error:', error);
            await kaya.sendMessage(from, { text: '❌ Erreur lors de la création du sticker.' }, { quoted: mek });
        }
    }
};
