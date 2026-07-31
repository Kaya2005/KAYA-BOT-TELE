import fetch from 'node-fetch';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

export default {
  name: 'emojimix',
  alias: ['emojimix', 'mixemoji'],
  description: '🎴 Mix two emojis to create a sticker',
  category: 'Tools',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);
      const text = args.join(' ').trim();

      if (!text || !text.includes('+')) {
        const caption = `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*🎴 EMOJI MIX*
Usage: \`${prefix}emojimix 😎+🥰\`
Separate two emojis with a *+* sign.
`.trim();
        return await sendWithBotImage(kaya, from, sender, { caption });
      }

      let [emoji1, emoji2] = text.split('+').map(e => e.trim());

      // Fonction utilisant emojikitchen.dev pour récupérer l'URL de l'image
      const fetchEmojiKitchen = async (e1, e2) => {
        try {
          const url = `https://emojikitchen.dev/api/v1/combine?left=${encodeURIComponent(e1)}&right=${encodeURIComponent(e2)}`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data && data.url) {
              return data.url;
            }
          }
        } catch (e) {
          // Ignore l'erreur réseau pour tester l'ordre inversé
        }
        return null;
      };

      // 1. Essai dans l'ordre initial
      let imageUrl = await fetchEmojiKitchen(emoji1, emoji2);

      // 2. Si non trouvé, essai dans l'ordre inverse
      if (!imageUrl) {
        imageUrl = await fetchEmojiKitchen(emoji2, emoji1);
      }

      // 3. Si toujours rien, la combinaison n'existe pas
      if (!imageUrl) {
        return await kaya.sendMessage(from, { text: '❌ These emojis cannot be mixed!' }, { quoted: mek });
      }

      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const tempFile = path.join(tmpDir, `temp_${Date.now()}.png`);
      const outputFile = path.join(tmpDir, `sticker_${Date.now()}.webp`);

      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.buffer();
      fs.writeFileSync(tempFile, buffer);

      const ffmpegCommand = `ffmpeg -i "${tempFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -vcodec libwebp -lossless 1 -qscale 0 -preset default "${outputFile}"`;

      await new Promise((resolve, reject) => {
        exec(ffmpegCommand, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const stickerBuffer = fs.readFileSync(outputFile);
      await kaya.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

      // Nettoyage des fichiers temporaires
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);

    } catch (error) {
      console.error('❌ Emojimix error:', error);
      return await kaya.sendMessage(from, { text: '❌ Failed to mix emojis!' }, { quoted: mek });
    }
  }
};
