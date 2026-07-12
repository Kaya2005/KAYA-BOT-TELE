// ================= commands/photo.js =================

import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export default {
    name: 'photo',
    alias: ['p', 'image', 'topng'],
    description: 'Convert a sticker into a PNG image',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Détection du sticker (réponse ou message direct)
            const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const stickerMsg = mek.message?.stickerMessage || quoted?.stickerMessage;

            if (!stickerMsg) {
                return kaya.sendMessage(
                    from,
                    { text: `⚠️ *Usage:* Réponds à un sticker avec ${prefix}photo` },
                    { quoted: mek }
                );
            }

            // Indiquer que le bot travaille
            await kaya.sendPresenceUpdate('composing', from);

            // Téléchargement du sticker
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            const chunks = [];

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            if (!buffer || buffer.length < 100) {
                return kaya.sendMessage(
                    from,
                    { text: '❌ Impossible de lire ce sticker (corrompu ou invalide).' },
                    { quoted: mek }
                );
            }

            // Conversion WebP vers PNG avec Sharp
            const pngBuffer = await sharp(buffer).png().toBuffer();

            // Envoi de l'image
            await kaya.sendMessage(
                from,
                {
                    image: pngBuffer,
                    caption: '✅ Sticker converti en PNG.',
                    mimetype: 'image/png'
                },
                { quoted: mek }
            );

        } catch (error) {
            console.error('❌ Photo command error:', error);

            await kaya.sendMessage(
                from,
                { text: '❌ Erreur lors de la conversion du sticker.' },
                { quoted: mek }
            );
        }
    }
};