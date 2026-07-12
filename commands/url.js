import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { uploadByBuffer } from 'telegraph-uploader';

export default {
    name: 'url',
    alias: ['geturl', 'upload'],
    description: 'Get an URL for an image/video',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const mediaMsg = mek.message?.imageMessage || mek.message?.videoMessage || 
                             quoted?.imageMessage || quoted?.videoMessage;

            if (!mediaMsg) {
                return kaya.sendMessage(from, { text: `⚠️ *Usage:* Réponds à une image ou une vidéo avec ${prefix}url` }, { quoted: mek });
            }

            await kaya.sendPresenceUpdate('composing', from);

            // Déterminer le type MIME
            const mime = mediaMsg.mimetype || (mediaMsg.videoMessage ? 'video/mp4' : 'image/jpeg');
            const type = mime.split('/')[0]; // "image" ou "video"

            // Téléchargement
            const stream = await downloadContentFromMessage(mediaMsg, type);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const buffer = Buffer.concat(chunks);

            // Upload - On envoie le buffer et le type
            // Note: telegraph-uploader attend souvent le type 'image' ou 'video'
            const res = await uploadByBuffer(buffer, type === 'video' ? 'video' : 'image');

            await kaya.sendMessage(from, { 
                text: `✅ *Lien généré avec succès :*\n\nhttps://telegra.ph${res.link}` 
            }, { quoted: mek });

        } catch (error) {
            // Afficher l'erreur réelle dans la console pour déboguer
            console.error('❌ URL command error details:', error);
            await kaya.sendMessage(from, { text: '❌ Erreur lors de l\'upload du média.' }, { quoted: mek });
        }
    }
};
