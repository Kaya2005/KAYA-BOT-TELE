import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'url',
    alias: ['tourl', 'telegraph', 'imgurl'],
    description: 'Convert a replied image or video into a public Telegra.ph URL',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Robust quoted message detection
            const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage || mek.message;
            const messageType = Object.keys(quoted)[0];

            let mediaMsg = null;
            let mime = '';

            if (messageType === 'imageMessage' || quoted.imageMessage) {
                mediaMsg = quoted.imageMessage || mek.message.imageMessage;
                mime = mediaMsg.mimetype || 'image/jpeg';
            } else if (messageType === 'videoMessage' || quoted.videoMessage) {
                mediaMsg = quoted.videoMessage || mek.message.videoMessage;
                mime = mediaMsg.mimetype || 'video/mp4';
            } else if (messageType === 'documentMessage' || quoted.documentMessage) {
                mediaMsg = quoted.documentMessage || mek.message.documentMessage;
                mime = mediaMsg.mimetype || 'application/octet-stream';
            }

            if (!mediaMsg || !/image|video|document/.test(mime)) {
                return kaya.sendMessage(
                    from,
                    {
                        text: `⚠️ *Usage:* Reply to an image or video with \`${prefix}url\``
                    },
                    { quoted: mek }
                );
            }

            // Vérification de la taille (Limite stricte de 5 Mo pour Telegra.ph)
            const MAX_SIZE = 5 * 1024 * 1024;
            if (mediaMsg.fileLength && Number(mediaMsg.fileLength) > MAX_SIZE) {
                return kaya.sendMessage(
                    from,
                    { text: '❌ Le fichier est trop volumineux pour Telegra.ph (Maximum 5 Mo).' },
                    { quoted: mek }
                );
            }

            await kaya.sendPresenceUpdate('composing', from);

            // Secure media download
            const typeDownload = mime.includes('video') ? 'video' : (mime.includes('document') ? 'document' : 'image');
            const stream = await downloadContentFromMessage(mediaMsg, typeDownload);
            const chunks = [];

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            if (!buffer || buffer.length === 0) {
                return kaya.sendMessage(
                    from,
                    {
                        text: '❌ The media file is empty or corrupted.'
                    },
                    { quoted: mek }
                );
            }

            // Sécurité supplémentaire sur la taille du buffer réel téléchargé
            if (buffer.length > MAX_SIZE) {
                return kaya.sendMessage(
                    from,
                    { text: '❌ Le fichier dépasse la limite autorisée de 5 Mo.' },
                    { quoted: mek }
                );
            }

            // Détermination de l'extension et du type MIME correct
            let ext = 'jpg';
            let uploadMime = 'image/jpeg';
            if (mime.includes('png')) { ext = 'png'; uploadMime = 'image/png'; }
            else if (mime.includes('webp')) { ext = 'webp'; uploadMime = 'image/webp'; }
            else if (mime.includes('mp4')) { ext = 'mp4'; uploadMime = 'video/mp4'; }
            else if (mime.includes('gif')) { ext = 'gif'; uploadMime = 'image/gif'; }

            // Préparation des données pour l'API Telegra.ph
            const formData = new FormData();
            const blob = new Blob([buffer], { type: uploadMime });
            formData.append('file', blob, `file_${Date.now()}.${ext}`);

            const response = await fetch('https://telegra.ph/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Telegra.ph server error (Status ${response.status})`);
            }

            const result = await response.json();

            if (result.error || !result[0]?.src) {
                throw new Error(result.error || 'Invalid response from Telegra.ph');
            }

            const mediaUrl = `https://telegra.ph${result[0].src}`;

            await kaya.sendMessage(
                from,
                {
                    text: `✅ *Media uploaded successfully!*\n\n🔗 ${mediaUrl}`
                },
                { quoted: mek }
            );

        } catch (err) {
            console.error('❌ Critical error in url command:', err);

            await kaya.sendMessage(
                from,
                {
                    text: `❌ An error occurred: ${err.message}`
                },
                { quoted: mek }
            );
        }
    }
};
