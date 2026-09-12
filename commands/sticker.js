import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';

export default {
    name: 'sticker',
    alias: ['s', 'stiker', 'stick'],
    description: 'Convert image or short video/gif to sticker',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Robust media detection (direct message or quoted message)
            const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage || mek.message;
            const messageType = Object.keys(quoted)[0];
            
            // Media content extraction
            let mediaMsg = null;
            let mime = '';

            if (messageType === 'imageMessage' || quoted.imageMessage) {
                mediaMsg = quoted.imageMessage || mek.message.imageMessage;
                mime = mediaMsg.mimetype || 'image/jpeg';
            } else if (messageType === 'videoMessage' || quoted.videoMessage) {
                mediaMsg = quoted.videoMessage || mek.message.videoMessage;
                mime = mediaMsg.mimetype || 'video/mp4';
            } else if (messageType === 'stickerMessage' || quoted.stickerMessage) {
                // If user replies to a sticker to resend it
                mediaMsg = quoted.stickerMessage || mek.message.stickerMessage;
                mime = 'image/webp';
            }

            if (!mediaMsg || (!/image|video|webp/.test(mime))) {
                return await kaya.sendMessage(
                    from, 
                    { text: `⚠️ *Usage:* Reply to an image or a video with \`${prefix}sticker\`` }, 
                    { quoted: mek }
                );
            }

            // Size limit to 10 MB to prevent memory exhaustion
            if (mediaMsg.fileLength && Number(mediaMsg.fileLength) > 10 * 1024 * 1024) {
                return await kaya.sendMessage(from, { text: '❌ The file is too large (Maximum 10 MB).' }, { quoted: mek });
            }

            // Downloading media stream
            const typeDownload = mime.includes('video') ? 'video' : 'image';
            const stream = await downloadContentFromMessage(mediaMsg, typeDownload);
            const chunks = [];

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            if (!buffer || buffer.length === 0) {
                return await kaya.sendMessage(from, { text: '❌ Unable to download or read this media.' }, { quoted: mek });
            }

            // Ultra-stable conversion to WebP via Sharp with KAYA BOT metadata injection
            let webpBuffer;
            
            if (mime.includes('video') || mime.includes('gif')) {
                // For videos/GIFs (animated WebP with standard WhatsApp dimensions 512x512)
                webpBuffer = await sharp(buffer, { animated: true })
                    .resize(512, 512, {
                        fit: 'contain',
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .webp({ quality: 50, loop: 0, effort: 2 })
                    .toBuffer();
            } else {
                // For static images
                webpBuffer = await sharp(buffer)
                    .resize(512, 512, {
                        fit: 'contain',
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .webp({ quality: 80 })
                    .toBuffer();
            }

            // Sending the generated sticker directly without any text message
            await kaya.sendMessage(
                from,
                { sticker: webpBuffer },
                { quoted: mek }
            );

        } catch (err) {
            console.error('❌ Critical error in sticker command:', err);
            await kaya.sendMessage(from, { text: '❌ An error occurred while creating the sticker.' }, { quoted: mek });
        }
    }
};
