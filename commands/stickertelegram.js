// ================= commands/tg.js =================
import fetch from 'node-fetch';
import fs from 'fs';
import { exec } from 'child_process';
import { writeExif } from '../setting/exif.js';

const delay = ms => new Promise(r => setTimeout(r, ms));
const MAX_STICKERS = 200;

function convertMedia(input, output, animated = false) {
    return new Promise((resolve, reject) => {
        const cmd = animated
            ? `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -loop 0 -preset default -an -vsync 0 "${output}"`
            : `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -loop 0 -preset default -an -vsync 0 "${output}"`;

        exec(cmd, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

export default {
    name: 'tg',
    alias: ['telegram', 'stickertg'],
    category: 'Tools',
    description: 'Download Telegram sticker pack with custom packname',

    async execute(kaya, mek, from, args, prefix) {
        try {
            if (!args[0]) {
                return kaya.sendMessage(
                    from,
                    { 
                        text: `⚠️ *Exemple d'utilisation :*\n\n` +
                              `1️⃣ *Par défaut :*\n${prefix}tg https://t.me/addstickers/NomDuPack\n\n` +
                              `2️⃣ *Nom personnalisé :*\n${prefix}tg naya https://t.me/addstickers/NomDuPack` 
                    },
                    { quoted: mek }
                );
            }

            let customPackName = '';
            let url = '';

            if (args.length >= 2) {
                url = args[args.length - 1];
                customPackName = args.slice(0, args.length - 1).join(' ');
            } else {
                url = args[0];
                customPackName = global.botName || 'KAYA-MD';
            }

            if (!url.includes('t.me/addstickers/')) {
                return kaya.sendMessage(from, { text: '❌ Lien Telegram invalide.' }, { quoted: mek });
            }

            const packName = url.split('/').pop();
            const botToken = '8573048627:AAFDdZftcCTJCru2HxbsowjdpfjrJzE2aMw';

            const res = await fetch(
                `https://api.telegram.org/bot${botToken}/getStickerSet?name=${packName}`
            );
            const data = await res.json();

            if (!data.ok) {
                return kaya.sendMessage(
                    from,
                    { text: '❌ Pack introuvable ou token invalide.' },
                    { quoted: mek }
                );
            }

            let stickers = data.result.stickers;
            if (stickers.length > MAX_STICKERS) {
                stickers = stickers.slice(0, MAX_STICKERS);
            }

            await kaya.sendMessage(from, {
                text: `📦 *Pack:* ${stickers.length} stickers\n🏷️ *Nom attribué:* ${customPackName}\n⏳ Envoi en cours...`
            }, { quoted: mek });

            let success = 0;

            for (let i = 0; i < stickers.length; i++) {
                let input = null;
                let output = null;
                let exifFile = null;

                try {
                    const sticker = stickers[i];

                    const fileRes = await fetch(
                        `https://api.telegram.org/bot${botToken}/getFile?file_id=${sticker.file_id}`
                    );
                    const fileJson = await fileRes.json();

                    if (!fileJson.ok) continue;

                    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileJson.result.file_path}`;
                    const buffer = Buffer.from(
                        await (await fetch(fileUrl)).arrayBuffer()
                    );

                    input = `./tmp_${Date.now()}_${i}`;
                    output = `./out_${Date.now()}_${i}.webp`;

                    fs.writeFileSync(input, buffer);

                    const isAnimated =
                        sticker.is_animated ||
                        sticker.is_video ||
                        fileJson.result.file_path.endsWith('.tgs');

                    await convertMedia(input, output, isAnimated);

                    exifFile = await writeExif(
                        {
                            data: fs.readFileSync(output),
                            mimetype: 'image/webp'
                        },
                        {
                            packname: customPackName,
                            author: customPackName,
                            categories: [sticker.emoji || '🤖']
                        }
                    );

                    await kaya.sendMessage(from, {
                        sticker: fs.readFileSync(exifFile)
                    });

                    success++;
                    await delay(700);

                } catch (e) {
                    console.error("Erreur sticker:", e);
                } finally {
                    // GARANTIE DE NETTOYAGE : S'exécute quoi qu'il arrive (succès ou erreur)
                    try { if (input && fs.existsSync(input)) fs.unlinkSync(input); } catch {}
                    try { if (output && fs.existsSync(output)) fs.unlinkSync(output); } catch {}
                    try { if (exifFile && fs.existsSync(exifFile)) fs.unlinkSync(exifFile); } catch {}
                }
            }

            await kaya.sendMessage(from, {
                text: `✅ Stickers envoyés: ${success}/${stickers.length}`
            }, { quoted: mek });

        } catch (err) {
            console.error(err);
            await kaya.sendMessage(from, {
                text: '❌ Échec lors du téléchargement du pack.'
            }, { quoted: mek });
        }
    }
};
