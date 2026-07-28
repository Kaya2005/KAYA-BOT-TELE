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
            const mime = (quoted.msg || quoted).mimetype || '';

            if (!/image|video/.test(mime)) {
                return await kaya.sendMessage(from, { text: '⚠️ Veuillez répondre à une image ou une vidéo.' }, { quoted: mek });
            }

            // Avertissement de chargement optionnel pour l'expérience utilisateur
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

            const stickerBuffer = await addExif(buffer, stickerOptions);

            await kaya.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur critique dans la commande sticker :', err);
            await kaya.sendMessage(from, { text: '❌ Une erreur est survenue lors de la création du sticker.' }, { quoted: mek });
        }
    }
};
