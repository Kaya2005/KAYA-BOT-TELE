// ==================== commands/take.js ====================
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export default {
    name: 'take',
    alias: ['steal', 'reprendre', 'vol'],
    description: 'Reprend un média en modifiant l\'auteur',
    category: 'Sticker',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const quoted = mek.quoted ? mek.quoted : mek;
            const mime = (quoted.msg || quoted).mimetype || '';

            if (!/image|video|sticker/.test(mime)) {
                return await kaya.sendMessage(from, { 
                    text: '⚠️ *Usage:* Reply to a sticker/image/video with .take [name]' 
                }, { quoted: mek });
            }

            await kaya.sendPresenceUpdate('composing', from);

            // Téléchargement du buffer
            const stream = await downloadContentFromMessage(quoted, mime.split('/')[0]);
            let buffer = Buffer.alloc(0);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Définition de l'auteur
            const authorName = args.length > 0 ? args.join(' ') : (mek.pushName || 'Kaya-MD');

            // Création du sticker avec wa-sticker-formatter
            const sticker = new Sticker(buffer, {
                pack: ' ', // Espace insécable pour éviter le bug de chaîne vide
                author: authorName,
                type: mime.includes('video') ? StickerTypes.ANIMATED : StickerTypes.FULL,
                categories: ['🎨'],
                quality: 70,
                background: 'transparent'
            });

            const stickerBuffer = await sticker.toBuffer();

            await kaya.sendMessage(from, { 
                sticker: stickerBuffer 
            }, { quoted: mek });

        } catch (err) {
            console.error('❌ Take error:', err);
            await kaya.sendMessage(from, { text: '❌ Failed to create sticker.' }, { quoted: mek });
        }
    }
};
