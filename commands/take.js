import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';

export default {
    name: 'take',
    alias: ['steal', 't'],
    description: 'Steal a sticker and change its pack/author name',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Détection robuste du message cité contenant un sticker
            const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage || mek.message;
            const messageType = Object.keys(quoted)[0];

            let stickerMsg = null;
            if (messageType === 'stickerMessage' || quoted.stickerMessage) {
                stickerMsg = quoted.stickerMessage || mek.message.stickerMessage;
            }

            if (!stickerMsg) {
                return await kaya.sendMessage(
                    from, 
                    { text: `⚠️ *Usage:* Reply to a sticker with \`${prefix}take\` or \`${prefix}take [packname]\`` }, 
                    { quoted: mek }
                );
            }

            // Téléchargement du flux du sticker
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            const chunks = [];

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            if (!buffer || buffer.length === 0) {
                return await kaya.sendMessage(from, { text: '❌ The sticker is empty or corrupted.' }, { quoted: mek });
            }

            // Récupération dynamique du packname : 
            // Soit les arguments saisis, soit le pseudo de l'utilisateur (pushName), soit 'KAYA-BOT' par défaut
            const pushName = mek.pushName || 'KAYA-BOT';
            const input = args.join(' ').trim();
            const packName = input || pushName;
            const authorName = 'kaya-tech';

            // Conversion et redimensionnement sécurisé via Sharp (zéro risque de crash)
            const webpBuffer = await sharp(buffer, { animated: true })
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 80, loop: 0 })
                .toBuffer();

            // Injection propre des métadonnées EXIF (Packname & Author) pour WhatsApp
            const exifAttr = JSON.parse(`{
                "sticker-pack-id": "https://github.com/Kaya-tech/kaya-bot",
                "sticker-pack-name": "${packName}",
                "sticker-pack-publisher": "${authorName}",
                "emojis": ["🤩", "🎉"]
            }`);

            const exifHeader = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
            const jsonBuffer = Buffer.from(JSON.stringify(exifAttr), 'utf-8');
            const exif = Buffer.concat([exifHeader, jsonBuffer]);
            exif.writeUIntLE(jsonBuffer.length, 14, 4);

            let finalBuffer = webpBuffer;
            try {
                const exifChunk = Buffer.concat([
                    Buffer.from('EXIF', 'ascii'),
                    Buffer.alloc(4),
                    exif
                ]);
                exifChunk.writeUInt32LE(exif.length, 4);
                finalBuffer = Buffer.concat([webpBuffer, exifChunk]);
                finalBuffer.writeUInt32LE(finalBuffer.length - 8, 4);
            } catch (e) {
                console.error('⚠️ Erreur injection EXIF :', e);
            }

            // Envoi direct du sticker sans aucun texte d'accompagnement
            await kaya.sendMessage(from, { sticker: finalBuffer }, { quoted: mek });

        } catch (error) {
            console.error('❌ Critical error in take command:', error);
            await kaya.sendMessage(from, { text: '❌ An error occurred while taking the sticker.' }, { quoted: mek });
        }
    }
};
