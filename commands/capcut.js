// capcut.js
import axios from 'axios';
import { getBotName } from '../setting/botAssets.js';
import { usageBox, errorBox, boxMessage } from '../setting/theme.js';
import { getString } from '../setting/language.js';

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
  name: 'capcut',
  aliases: ['cc', 'capcuttemplate'],
  category: 'media',
  description: '🎬 Download original video from CapCut template',
  usage: '.capcut <url>',

  async execute(kaya, mek, from, args, prefix) {
    const url = args.join(' ').trim();
    const botName = getBotName(mek.sender);
    const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

    if (!url) {
      return await kaya.sendMessage(from, { 
        text: usageBox(prefix, 'capcut', '<url>')
      }, { quoted: mek });
    }

    try {
      await kaya.sendMessage(from, { react: { text: '⏳', key: mek.key } });

      const apiUrl = `https://backend1.tioo.eu.org/capcut?url=${encodeURIComponent(url)}`;
      const response = await fetchWithRetry(apiUrl, 3, 15000);
      const data = response.data;

      if (!data?.status || data.code !== 200 || !data.originalVideoUrl) {
        throw new Error(data?.message || getString(ownerId, 'capcutInvalidResponse'));
      }

      const videoUrl = data.originalVideoUrl;
      const title = data.title || getString(ownerId, 'capcutDefaultTitle');
      const author = data.authorName || getString(ownerId, 'capcutUnknownAuthor');

      const content = `📌 *${getString(ownerId, 'capcutTitleLabel')} :* ${title}\n👤 *${getString(ownerId, 'capcutAuthorLabel')} :* ${author}\n\n> *Powered by ${botName}*`;
      const caption = boxMessage(getString(ownerId, 'capcutBoxTitle'), content, '🎬');

      await kaya.sendMessage(from, {
        video: { url: videoUrl },
        mimetype: 'video/mp4',
        caption: caption
      }, { quoted: mek });

      await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
      console.error('CapCut download error:', error);
      let errorMsg = getString(ownerId, 'capcutDownloadFailed');
      if (error.code === 'ECONNABORTED') errorMsg += ` ${getString(ownerId, 'capcutTimeout')}`;
      else errorMsg += ` ${error.message}`;
      
      await kaya.sendMessage(from, { text: errorBox(errorMsg) }, { quoted: mek });
      await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
  }
};
