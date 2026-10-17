// ================= commands/photo.js =================

import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getString } from '../setting/language.js';

export default {
    name: 'photo',
    alias: ['p', 'image', 'topng'],
    description: 'Convert a sticker into a PNG image',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

            // Détection du sticker (réponse ou message direct)
            const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const stickerMsg = mek.message?.stickerMessage || quoted?.stickerMessage;

            if (!stickerMsg) {
                const usageMsg = getString(ownerId, 'photoUsage').replace('{prefix}', prefix);
                return kaya.sendMessage(
                    from,
                    { text: `⚠️ *${usageMsg}*` },
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
                    { text: `❌ ${getString(ownerId, 'photoCorrupted')}` },
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
                    caption: `✅ ${getString(ownerId, 'photoSuccess')}`,
                    mimetype: 'image/png'
                },
                { quoted: mek }
            );

        } catch (error) {
            console.error('❌ Photo command error:', error);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

            await kaya.sendMessage(
                from,
                { text: `❌ ${getString(ownerId, 'photoError')}` },
                { quoted: mek }
            );
        }
    }
};
