import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export default {
    name: 'sticker',
    alias: ['s', 'stiker', 'stick'],
    description: 'Convert media to sticker',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // 1. Détection robuste du média (compatible v7)
            const quoted = mek.quoted ? mek.quoted : mek;
            const message = mek.message?.imageMessage || mek.message?.videoMessage || 
                            quoted.imageMessage || quoted.videoMessage;

            if (!message) {
                return kaya.sendMessage(from, { text: `⚠️ Répondez à une image ou une vidéo.` }, { quoted: mek });
            }

            await kaya.sendPresenceUpdate('composing', from);

            // 2. Téléchargement via la méthode qui fonctionne avec votre ancien code
            // On s'assure de passer l'objet message complet à la fonction
            const stream = await downloadContentFromMessage(message, message.mimetype.includes('video') ? 'video' : 'image');
            
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const buffer = Buffer.concat(chunks);

            // 3. Création du sticker
            const sticker = new Sticker(buffer, {
                pack: 'Kaya Bot',
                author: 'Kaya',
                type: StickerTypes.CROPPED, // Utilisation de CROPPED pour économiser la RAM
                quality: 20                // Qualité réduite pour éviter les crashs
            });

            await kaya.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: mek });

        } catch (error) {
            console.error('❌ Sticker error:', error);
            await kaya.sendMessage(from, { text: `❌ Erreur : ${error.message || 'Impossible de traiter le média.'}` }, { quoted: mek });
        }
    }
};
