import axios from 'axios';
import { getBotName } from '../setting/botAssets.js';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'okhttp/4.9.3'
];

async function fetchWithRetry(url, maxRetries = 3, timeout = 15000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const userAgent = USER_AGENTS[(attempt - 1) % USER_AGENTS.length];
      const response = await axios.get(url, {
        timeout,
        headers: { 'User-Agent': userAgent }
      });
      return response;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  throw lastError;
}

export default {
  name: 'facebook',
  aliases: ['fb', 'fbdl'],
  category: 'media',
  description: '📘 Download Facebook videos (supports HD)',
  usage: '.facebook <url> [hd]',

  async execute(kaya, mek, from, args, prefix) {
    const url = args[0];
    if (!url) {
      return await kaya.sendMessage(from, { 
        text: `❌ Please provide a Facebook video URL.\nExample: \`${prefix}facebook <url> hd\`` 
      }, { quoted: mek });
    }

    // Déterminer si l'utilisateur veut du HD
    const remainingArgs = args.slice(1).join(' ').trim().toLowerCase();
    const wantHD = remainingArgs === 'hd';

    try {
      await kaya.sendMessage(from, { react: { text: '⏳', key: mek.key } });

      const apiUrl = `https://backend1.tioo.eu.org/fbdown?url=${encodeURIComponent(url)}`;
      const response = await fetchWithRetry(apiUrl, 3, 15000);
      const data = response.data;

      if (!data?.status) {
        throw new Error(data?.message || 'Invalid API response');
      }

      let videoUrl;
      if (wantHD) {
        videoUrl = data.HD || data.hd;
        if (!videoUrl) {
          videoUrl = data.Normal_video || data.normal_video;
          if (videoUrl) {
            await kaya.sendMessage(from, { text: 'ℹ️ HD version not available, sending normal quality instead.' }, { quoted: mek });
          }
        }
      } else {
        videoUrl = data.Normal_video || data.normal_video || data.HD || data.hd;
      }

      if (!videoUrl) {
        throw new Error('No downloadable video URL found');
      }

      const qualityText = wantHD && videoUrl === (data.HD || data.hd) ? ' (HD)' : '';
      const botName = getBotName(mek.sender);
      const caption = `📘 *Facebook Video${qualityText}*\n\n> *Powered by ${botName}*`;

      await kaya.sendMessage(from, {
        video: { url: videoUrl },
        mimetype: 'video/mp4',
        caption: caption
      }, { quoted: mek });

      await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
      console.error('Facebook download error:', error);
      let errorMsg = '❌ Failed to download.';
      if (error.code === 'ECONNABORTED') errorMsg += ' Request timed out.';
      else errorMsg += ` ${error.message}`;
      
      await kaya.sendMessage(from, { text: errorMsg }, { quoted: mek });
      await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
  }
};
