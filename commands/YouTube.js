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

function isYoutubeUrl(text) {
  const patterns = [
    /youtube\.com\/watch\?v=/,
    /youtu\.be\//,
    /youtube\.com\/shorts\//,
    /youtube\.com\/embed\//,
    /m\.youtube\.com\/watch\?v=/
  ];
  return patterns.some(pattern => pattern.test(text));
}

async function searchYoutube(query) {
  const apiUrl = `https://backend1.tioo.eu.org/yts?q=${encodeURIComponent(query)}`;
  const response = await fetchWithRetry(apiUrl, 3, 15000);
  const data = response.data;

  if (!data?.status || !data?.videos || data.videos.length === 0) {
    throw new Error('No videos found for your query.');
  }

  const topVideo = data.videos[0];
  return {
    title: topVideo.title,
    videoUrl: topVideo.url,
    author: topVideo.author?.name || 'Unknown'
  };
}

async function downloadYoutube(url) {
  const apiUrl = `https://backend1.tioo.eu.org/YouTube?url=${encodeURIComponent(url)}`;
  const response = await fetchWithRetry(apiUrl, 3, 20000);
  const data = response.data;

  if (!data?.status || !data?.mp4) {
    throw new Error('Could not extract video URL.');
  }

  return {
    mp4: data.mp4,
    title: data.title || 'YouTube Video',
    author: data.author || 'Unknown'
  };
}

export default {
  name: 'video',
  aliases: ['youtube', 'ytdl'],
  category: 'media',
  description: '🎬 Download YouTube videos (supports URL or search query)',
  usage: '.yt <url or search query>',

  async execute(kaya, mek, from, args, prefix) {
    const input = args.join(' ').trim();
    const botName = getBotName(mek.sender);

    if (!input) {
      return await kaya.sendMessage(from, { 
        text: `❌ Please provide a YouTube URL or search query.\nExample: \`${prefix}yt <url or query>\`` 
      }, { quoted: mek });
    }

    try {
      await kaya.sendMessage(from, { react: { text: '⏳', key: mek.key } });

      let videoInfo;

      if (isYoutubeUrl(input)) {
        videoInfo = await downloadYoutube(input);
      } else {
        const searchInfo = await searchYoutube(input);
        videoInfo = await downloadYoutube(searchInfo.videoUrl);
        if (videoInfo.author === 'Unknown' && searchInfo.author !== 'Unknown') {
          videoInfo.author = searchInfo.author;
        }
      }

      let caption = `🎬 *${videoInfo.title}*`;
      if (videoInfo.author && videoInfo.author !== 'Unknown') {
        caption += `\n👤 *Author:* ${videoInfo.author}`;
      }
      caption += `\n\n> *Powered by ${botName}*`;

      await kaya.sendMessage(from, {
        video: { url: videoInfo.mp4 },
        mimetype: 'video/mp4',
        caption: caption
      }, { quoted: mek });

      await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
      console.error('YouTube plugin error:', error);
      let errorMsg = '❌ Failed to download.';
      if (error.code === 'ECONNABORTED') errorMsg += ' Request timed out.';
      else errorMsg += ` ${error.message}`;
      
      await kaya.sendMessage(from, { text: errorMsg }, { quoted: mek });
      await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
  }
};
