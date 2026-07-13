import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'sticker',
    alias: ['s', 'stiker', 'stick'],
    description: 'Convert media to sticker',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Détection du média (image ou vidéo) - soit dans le message, soit dans la citation
            const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const mediaMsg = mek.message?.imageMessage || mek.message?.videoMessage || 
                             quoted?.imageMessage || quoted?.videoMessage;

            if (!mediaMsg) {
                return kaya.sendMessage(
                    from,
                    { text: `⚠️ *Usage:* Réponds à une image ou une vidéo avec ${prefix}sticker` },
                    { quoted: mek }
                );
            }

            // Indiquer que le bot travaille
            await kaya.sendPresenceUpdate('composing', from);

            // Téléchargement du contenu
            const type = mediaMsg.mimetype?.includes('video') ? 'video' : 'image';
            const stream = await downloadContentFromMessage(mediaMsg, type);
            const chunks = [];

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            // Envoi du sticker
            await kaya.sendMessage(
                from,
                { sticker: buffer },
                { quoted: mek }
            );

        } catch (error) {
            console.error('❌ Sticker command error:', error);
            await kaya.sendMessage(
                from,
                { text: '❌ Erreur lors de la création du sticker.' },
                { quoted: mek }
            );
        }
    }
};
