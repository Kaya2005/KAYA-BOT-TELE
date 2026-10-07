import { Tiktok } from '../lib/tiktok.js';
import axios from 'axios';
import { boxMessage, errorBox, usageBox } from '../setting/theme.js';

export default {
  name: 'tiktok',
  alias: ['tt', 'ttdl'],
  description: 'Download a TikTok video without watermark.',
  category: 'Download',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const query = args.join(" ");

      if (!query) {
        return await kaya.sendMessage(from, { 
          text: usageBox(prefix, 'tiktok', '<url>') 
        }, { quoted: mek });
      }

      const data = await Tiktok(query);

      if (!data?.nowm) {
        return await kaya.sendMessage(from, { text: errorBox('Unable to retrieve the TikTok video. The link might be invalid.') }, { quoted: mek });
      }

      // Téléchargement du buffer de la vidéo
      const res = await axios.get(data.nowm, {
        responseType: 'arraybuffer',
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' 
        }
      });

      const content = `• *Title:* ${data.title || "Unavailable"}\n` +
                      `• *Author:* ${data.author || "Unknown"}\n\n` +
                      `> *Connect:* t.me/kaya243`;

      const caption = boxMessage('TikTok Download', content, '🎬');

      // Envoi direct via kaya.sendMessage pour garantir la compatibilité vidéo
      return await kaya.sendMessage(from, { 
        video: Buffer.from(res.data),
        caption: caption,
        mimetype: 'video/mp4' 
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ tiktok.js error:', err);
      return await kaya.sendMessage(from, { text: errorBox('An error occurred during the download process.') }, { quoted: mek });
    }
  }
};
