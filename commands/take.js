import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export default {
    name: 'take',
    alias: ['steal', 't'],
    description: 'Steal a sticker and change its pack/author name',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const quoted = mek.quoted ? mek.quoted : mek;
            const stickerMsg = quoted.msg || quoted;

            if (!stickerMsg.mimetype || !stickerMsg.mimetype.includes('sticker')) {
                return kaya.sendMessage(from, { text: `⚠️ Réponds à un sticker.` }, { quoted: mek });
            }

            const input = args.join(' ');
            const [packName, authorName] = input.includes('|') 
                ? input.split('|').map(s => s.trim()) 
                : [input || "Kaya Bot", "Kaya"];

            const buffer = await kaya.downloadMediaMessage(stickerMsg);

            const sticker = new Sticker(buffer, {
                pack: packName,
                author: authorName,
                type: StickerTypes.CROPPED,
                quality: 20 // OPTIMISÉ
            });

            await kaya.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: mek });
        } catch (error) {
            console.error('❌ Take error:', error);
            await kaya.sendMessage(from, { text: '❌ Erreur (mémoire saturée). Réessayez.' }, { quoted: mek });
        }
    }
};
