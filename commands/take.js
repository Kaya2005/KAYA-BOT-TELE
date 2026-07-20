import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export default {
    name: 'take',
    alias: ['steal', 't'],
    description: 'Steal a sticker and change its pack/author name',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // 1. Vérifier si l'utilisateur répond à un sticker
            const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const stickerMsg = mek.message?.stickerMessage || quoted?.stickerMessage;

            if (!stickerMsg) {
                return kaya.sendMessage(from, { text: `⚠️ *Usage:* Réponds à un sticker avec ${prefix}take [nom du pack] | [auteur]` }, { quoted: mek });
            }

            // 2. Définir le nom et l'auteur
            // Si args est vide, on prend le nom du pushName (pseudo WhatsApp)
            // Sinon, on divise par "|" pour séparer PackName et Author
            const input = args.join(' ');
            const [packName, authorName] = input.includes('|') 
                ? input.split('|').map(s => s.trim()) 
                : [input || mek.pushName, "Kaya Bot"];

            // 3. Télécharger le sticker
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const buffer = Buffer.concat(chunks);

            // 4. Reformater le sticker avec les nouvelles métadonnées
            const sticker = new Sticker(buffer, {
                pack: packName,
                author: authorName,
                type: StickerTypes.FULL,
                quality: 50
            });

            const stickerBuffer = await sticker.toBuffer();

            // 5. Envoyer
            await kaya.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

        } catch (error) {
            console.error('❌ Take error:', error);
            await kaya.sendMessage(from, { text: '❌ Erreur lors de la récupération du sticker.' }, { quoted: mek });
        }
    }
};
