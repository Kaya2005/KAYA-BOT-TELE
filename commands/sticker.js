import { addExif } from '../lib/sticker.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { StickerTypes } from 'wa-sticker-formatter';

export default {
    name: 'sticker',
    alias: ['s', 'stiker', 'stick'],
    description: 'Convert image or video to sticker',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const quoted = mek.quoted ? mek.quoted : mek;
            const mime = (quoted.msg || quoted).mimetype || quoted.mimetype || '';

            if (!/image|video/.test(mime)) {
                return await kaya.sendMessage(from, { text: '⚠️ Veuillez répondre à une image ou une vidéo.' }, { quoted: mek });
            }

            // Avertissement de chargement
            await kaya.sendMessage(from, { text: '⏳ Création du sticker en cours...' }, { quoted: mek }).catch(() => {});

            // Téléchargement sécurisé du média
            let stream;
            try {
                const mediaType = mime.split('/')[0];
                stream = await downloadContentFromMessage(quoted, mediaType);
            } catch (dlError) {
                console.error('❌ Erreur téléchargement média :', dlError);
                return await kaya.sendMessage(from, { text: '❌ Impossible de télécharger ce média.' }, { quoted: mek });
            }

            let buffer = Buffer.alloc(0);
            try {
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
            } catch (chunkError) {
                console.error('❌ Erreur lecture du flux média :', chunkError);
                return await kaya.sendMessage(from, { text: '❌ Erreur lors de la lecture du fichier.' }, { quoted: mek });
            }

            if (!buffer || buffer.length === 0) {
                return await kaya.sendMessage(from, { text: '❌ Le fichier est vide ou corrompu.' }, { quoted: mek });
            }

            const stickerOptions = {
                packname: 'KAYA-MD',
                author: 'kaya-tech',
                type: /video/.test(mime) ? StickerTypes.ANIMATED : StickerTypes.FULL
            };

            // Isolation de la génération EXIF pour éviter les crashs de socket
            let stickerBuffer;
            try {
                stickerBuffer = await addExif(buffer, stickerOptions);
            } catch (exifError) {
                console.error('❌ Erreur génération EXIF / Sticker :', exifError);
                return await kaya.sendMessage(from, { text: '❌ Erreur lors du traitement du sticker (fichier trop lourd ou format non supporté).' }, { quoted: mek });
            }

            if (!stickerBuffer || stickerBuffer.length === 0) {
                return await kaya.sendMessage(from, { text: '❌ Échec de la génération du sticker.' }, { quoted: mek });
            }

            await kaya.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur critique dans la commande sticker :', err);
            await kaya.sendMessage(from, { text: '❌ Une erreur est survenue lors de la création du sticker.' }, { quoted: mek });
        }
    }
};
