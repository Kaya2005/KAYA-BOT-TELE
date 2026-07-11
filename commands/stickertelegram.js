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
    category: 'Sticker',
    description: 'Download Telegram sticker pack',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const url = args[0];

            if (!url) {
                return kaya.sendMessage(
                    from,
                    { text: `⚠️ Exemple:\n${prefix}tg https://t.me/addstickers/NomDuPack` },
                    { quoted: mek }
                );
            }

            if (!url.includes('t.me/addstickers/')) {
                return kaya.sendMessage(from, { text: '❌ Lien Telegram invalide.' }, { quoted: mek });
            }

            const packName = url.split('/').pop();

            const botToken = '8904281656:AAE1OIFjb495IWH_oh06K6Vce09GHE0aeKY';

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

            const botName = global.botName || 'KAYA-MD';

            await kaya.sendMessage(from, {
                text: `📦 Pack: ${stickers.length} stickers\n⏳ Téléchargement en cours...`
            }, { quoted: mek });

            let success = 0;

            for (let i = 0; i < stickers.length; i++) {
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

                    const input = `./tmp_${Date.now()}_${i}`;
                    const output = `./out_${Date.now()}_${i}.webp`;

                    fs.writeFileSync(input, buffer);

                    const isAnimated =
                        sticker.is_animated ||
                        sticker.is_video ||
                        fileJson.result.file_path.endsWith('.tgs');

                    await convertMedia(input, output, isAnimated);

                    const exifFile = await writeExif(
                        {
                            data: fs.readFileSync(output),
                            mimetype: 'image/webp'
                        },
                        {
                            packname: botName,
                            author: botName,
                            categories: [sticker.emoji || '🤖']
                        }
                    );

                    await kaya.sendMessage(from, {
                        sticker: fs.readFileSync(exifFile)
                    });

                    success++;

                    try {
                        if (fs.existsSync(input)) fs.unlinkSync(input);
                        if (fs.existsSync(output)) fs.unlinkSync(output);
                        if (fs.existsSync(exifFile)) fs.unlinkSync(exifFile);
                    } catch {}

                    await delay(700);
                } catch (e) {
                    console.error("Erreur sticker:", e);
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