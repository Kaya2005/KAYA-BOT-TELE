import { getSetting } from '../setting.js'; 
import { getBotName } from '../setting/botAssets.js';
import { Tiktok } from '../lib/tiktok.js';
import axios from 'axios';

export default {
  name: 'tiktok',
  description: 'Download a TikTok video without watermark.',
  category: 'Download',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const botName = getBotName(from);
      const query = args.join(" ");

      if (!query) {
        return await kaya.sendMessage(from, { 
          text: `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*❌ NO LINK DETECTED*\n*Usage:* \`${prefix}tiktok <url>\`` 
        }, { quoted: mek });
      }

      await kaya.sendMessage(from, { text: "⏳ Downloading video, please wait..." }, { quoted: mek });

      const data = await Tiktok(query);

      if (!data?.nowm) {
        return await kaya.sendMessage(from, { text: '❌ Unable to retrieve the TikTok video. The link might be invalid.' }, { quoted: mek });
      }

      // Téléchargement du buffer de la vidéo
      const res = await axios.get(data.nowm, {
        responseType: 'arraybuffer',
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' 
        }
      });

      const caption = `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*🎬 TIKTOK DOWNLOADER*
*📌 Title:* ${data.title || "Unavailable"}
*👤 Author:* ${data.author || "Unknown"}
`.trim();

      // Envoi direct via kaya.sendMessage pour garantir la compatibilité vidéo
      return await kaya.sendMessage(from, { 
        video: Buffer.from(res.data),
        caption: caption,
        mimetype: 'video/mp4' 
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ tiktok.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ An error occurred during the download process.' }, { quoted: mek });
    }
  }
};
