import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export default {
    name: 'sticker',
    alias: ['s', 'stiker', 'stick'],
    description: 'Convert media to sticker',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const quoted = mek.quoted ? mek.quoted : mek;
            const mediaMsg = quoted.msg || quoted;
            
            if (!/image|video/.test(mediaMsg.mimetype)) {
                return kaya.sendMessage(from, { text: '⚠️ Réponds à une image ou vidéo.' }, { quoted: mek });
            }

            // SÉCURITÉ : Bloque les gros fichiers pour éviter le crash
            if (mediaMsg.fileLength > 1500000) { // 1.5 Mo max
                return kaya.sendMessage(from, { text: '❌ Fichier trop lourd (> 1.5 Mo).' }, { quoted: mek });
            }

            const buffer = await kaya.downloadMediaMessage(quoted);

            const sticker = new Sticker(buffer, {
                pack: 'Kaya Bot',
                author: 'Kaya',
                type: StickerTypes.CROPPED, // MOINS GOURMAND
                quality: 20 // OPTIMISÉ
            });

            await kaya.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: mek });
        } catch (error) {
            console.error('❌ Sticker error:', error);
            await kaya.sendMessage(from, { text: '❌ Erreur de traitement.' }, { quoted: mek });
        }
    }
};
