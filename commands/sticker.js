import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export default {
    name: 'sticker',
    alias: ['s', 'stiker', 'stick'],
    description: 'Convert media to sticker',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Dans la v7, 'mek' est souvent déjà traité, on cible le message
            const quoted = mek.quoted ? mek.quoted : mek;
            
            // Vérification du type de message v7
            const isMedia = quoted.mtype === 'imageMessage' || quoted.mtype === 'videoMessage';
            if (!isMedia) {
                return kaya.sendMessage(from, { text: '⚠️ Répondez à une image ou une vidéo.' }, { quoted: mek });
            }

            await kaya.sendPresenceUpdate('composing', from);

            // Utilisation de la méthode v7 officielle
            const buffer = await downloadMediaMessage(
                quoted,
                'buffer',
                {},
                { logger: console } // Permet de voir les erreurs de download dans la console
            );

            // Création du sticker
            const sticker = new Sticker(buffer, {
                pack: 'Kaya Bot',
                author: 'Kaya',
                type: StickerTypes.CROPPED, 
                quality: 20
            });

            await kaya.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: mek });

        } catch (error) {
            console.error('❌ Erreur v7 Sticker:', error);
            await kaya.sendMessage(from, { text: `❌ Erreur v7 : ${error.message}` }, { quoted: mek });
        }
    }
};
