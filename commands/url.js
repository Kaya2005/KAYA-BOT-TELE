import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { uploadByBuffer } from 'telegraph-uploader';

export default {
    name: 'url',
    alias: ['geturl', 'upload'],
    description: 'Get an URL for an image/video',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Détection du média (image ou vidéo)
            const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const mediaMsg = mek.message?.imageMessage || mek.message?.videoMessage || 
                             quoted?.imageMessage || quoted?.videoMessage;

            if (!mediaMsg) {
                return kaya.sendMessage(from, { text: `⚠️ *Usage:* Réponds à une image ou une vidéo avec ${prefix}url` }, { quoted: mek });
            }

            await kaya.sendPresenceUpdate('composing', from);

            // Téléchargement
            const type = mediaMsg.mimetype?.includes('video') ? 'video' : 'image';
            const stream = await downloadContentFromMessage(mediaMsg, type);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const buffer = Buffer.concat(chunks);

            // Upload sur Telegra.ph
            const res = await uploadByBuffer(buffer, type);

            // Envoi du résultat
            await kaya.sendMessage(from, { 
                text: `✅ *Lien généré avec succès :*\n\n${res.link}` 
            }, { quoted: mek });

        } catch (error) {
            console.error('❌ URL command error:', error);
            await kaya.sendMessage(from, { text: '❌ Erreur lors de l\'upload du média.' }, { quoted: mek });
        }
    }
};
