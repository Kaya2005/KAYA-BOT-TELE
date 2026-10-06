import axios from 'axios';
import { getBotName } from '../setting/botAssets.js';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'okhttp/4.9.3'
];

async function fetchWithRetry(url, maxRetries = 3, timeout = 20000) {
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
  name: 'mediafire',
  aliases: ['mf', 'mfdl'],
  category: 'media',
  description: '📁 Download files from MediaFire',
  usage: '.mediafire <url>',

  async execute(kaya, mek, from, args, prefix) {
    const url = args.join(' ').trim();
    
    if (!url) {
      return await kaya.sendMessage(from, { 
        text: `❌ Please provide a MediaFire URL.\nExample: \`${prefix}mediafire <url>\`` 
      }, { quoted: mek });
    }

    try {
      await kaya.sendMessage(from, { react: { text: '⏳', key: mek.key } });

      const apiUrl = `https://backend1.tioo.eu.org/MediaFire?url=${encodeURIComponent(url)}`;
      const response = await fetchWithRetry(apiUrl, 3, 20000);
      const data = response.data;

      if (!data?.status || !data?.url) {
        throw new Error(data?.message || 'Invalid API response');
      }

      const filename = data.filename || 'MediaFire_File';
      const filesize = data.filesize || data.filesizeH || 'Unknown';
      const uploadDate = data.upload_date ? new Date(data.upload_date).toLocaleString() : 'Unknown';
      const owner = data.owner || 'Unknown';
      const ext = data.ext || 'Unknown';
      const type = data.type || 'Unknown';
      const mimetype = data.mimetype || 'application/octet-stream';
      const downloadUrl = data.url;
      const botName = getBotName(mek.sender);

      const caption = `📁 *MediaFire File*\n\n` +
        `📄 *Filename:* ${filename}\n` +
        `📦 *Size:* ${filesize}\n` +
        `📅 *Uploaded:* ${uploadDate}\n` +
        `👤 *Owner:* ${owner}\n` +
        `🔤 *Extension:* ${ext}\n` +
        `📋 *Type:* ${type}\n\n` +
        `> *Powered by ${botName}*`;

      await kaya.sendMessage(from, {
        document: { url: downloadUrl },
        fileName: filename,
        mimetype: mimetype,
        caption: caption
      }, { quoted: mek });

      await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
      console.error('MediaFire download error:', error);
      let errorMsg = '❌ Failed to download.';
      if (error.code === 'ECONNABORTED') errorMsg += ' Request timed out.';
      else errorMsg += ` ${error.message}`;
      
      await kaya.sendMessage(from, { text: errorMsg }, { quoted: mek });
      await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
  }
};
