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
      const sender = mek.sender; // Récupération du sender
      const botName = getBotName(sender); // Utilisation du sender pour le nom
      const text = args.join(' ').trim();

      if (!text || !text.includes('+')) {
        const caption = `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*🎴 EMOJI MIX*
Usage: \`${prefix}emojimix 😎+🥰\`
Separate two emojis with a *+* sign.
`.trim();
        // Mise à jour : ajout de 'sender' comme 3ème argument
        return await sendWithBotImage(kaya, from, sender, { caption });
      }

      const [emoji1, emoji2] = text.split('+').map(e => e.trim());
      const url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return await kaya.sendMessage(from, { text: '❌ These emojis cannot be mixed!' }, { quoted: mek });
      }

      const imageUrl = data.results[0].url;
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

      // Cleanup
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);

    } catch (error) {
      console.error('❌ Emojimix error:', error);
      return await kaya.sendMessage(from, { text: '❌ Failed to mix emojis!' }, { quoted: mek });
    }
  }
};
