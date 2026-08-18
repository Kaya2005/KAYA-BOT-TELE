import axios from 'axios';
import yts from 'yt-search';
import { getBotName } from '../setting/botAssets.js';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'okhttp/4.9.3'
];

async function fetchWithRetry(url, maxRetries = 2, timeout = 12000) {
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
      await new Promise(resolve => setTimeout(resolve, 1000));
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
  try {
    const apiUrl = `https://backend1.tioo.eu.org/yts?q=${encodeURIComponent(query)}`;
    const response = await fetchWithRetry(apiUrl, 2, 10000);
    const data = response.data;

    if (data?.status && data?.videos?.length > 0) {
      return {
        url: data.videos[0].url,
        title: data.videos[0].title,
        thumbnail: data.videos[0].thumbnail
      };
    }
  } catch (e) {
    console.warn('[SONG SEARCH] Échec API Principale, tentative avec yt-search...');
  }

  const search = await yts(query);
  if (!search.videos.length) {
    throw new Error('Aucun résultat trouvé pour cette recherche.');
  }

  return {
    url: search.videos[0].url,
    title: search.videos[0].title,
    thumbnail: search.videos[0].thumbnail
  };
}

async function downloadAudioWithFallback(videoUrl) {
  const encodedUrl = encodeURIComponent(videoUrl);

  const apis = [
    {
      name: 'Tioo Backend',
      url: `https://backend1.tioo.eu.org/YouTube?url=${encodedUrl}`,
      extract: (data) => ({
        audioUrl: data?.mp3 || data?.mp4,
        title: data?.title
      })
    },
    {
      name: 'Vreden API',
      url: `https://api.vreden.web.id/api/ytmp3?url=${encodedUrl}`,
      extract: (data) => ({
        audioUrl: data?.result?.download?.url || data?.result?.url,
        title: data?.result?.title
      })
    },
    {
      name: 'Dreaded API',
      url: `https://api.dreaded.site/api/ytdl/audio?url=${encodedUrl}`,
      extract: (data) => ({
        audioUrl: data?.audioData?.downloadUrl || data?.downloadUrl,
        title: data?.title
      })
    },
    {
      name: 'Hector Worker',
      url: `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodedUrl}`,
      extract: (data) => ({
        audioUrl: data?.audio,
        title: data?.title
      })
    }
  ];

  for (const api of apis) {
    try {
      const response = await fetchWithRetry(api.url, 2, 15000);
      const result = api.extract(response.data);

      if (result?.audioUrl && result.audioUrl.startsWith('http')) {
        return result;
      }
    } catch (err) {
      console.warn(`[SONG API WARN] Échec sur ${api.name}: ${err.message}`);
    }
  }

  throw new Error('Toutes les API de téléchargement sont indisponibles actuellement.');
}

export default {
  name: 'song',
  aliases: ['play', 'sing', 'mp3'],
  category: 'media',
  description: '🎵 Télécharge et envoie des musiques depuis YouTube',

  async execute(kaya, mek, from, args, prefix) {
    const input = args.join(' ').trim();
    
    const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].split('@')[0] : '';
    const botName = getBotName(ownerId);

    if (!input) {
      return await kaya.sendMessage(from, { 
        text: `❌ Veuillez fournir un nom de chanson ou un lien YouTube.\nExemple : \`${prefix}song <titre ou url>\`` 
      }, { quoted: mek });
    }

    try {
      await kaya.sendMessage(from, { react: { text: '🔎', key: mek.key } });

      let targetUrl = input;
      let videoTitle = 'YouTube Audio';

      if (!isYoutubeUrl(input)) {
        const searchResult = await searchYoutube(input);
        targetUrl = searchResult.url;
        videoTitle = searchResult.title;
      }

      await kaya.sendMessage(from, { react: { text: '⏳', key: mek.key } });

      const downloadData = await downloadAudioWithFallback(targetUrl);
      const finalTitle = downloadData.title || videoTitle;
      const cleanTitle = finalTitle.replace(/[^a-zA-Z0-9-_\.]/g, '_');

      // 📥 Étape clé : Téléchargement du Buffer audio direct pour éviter les erreurs de lecture
      const audioBuffer = await axios.get(downloadData.audioUrl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': USER_AGENTS[0] },
        timeout: 30000
      });

      // 📤 Envoi propre du fichier binaire avec le bon MIME type
      await kaya.sendMessage(from, {
        audio: Buffer.from(audioBuffer.data),
        mimetype: 'audio/mpeg',
        fileName: `${cleanTitle}.mp3`,
        ptt: false
      }, { quoted: mek });

      await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
      console.error('Song plugin error:', error.message);
      
      await kaya.sendMessage(from, { 
        text: `❌ ${error.message || 'Échec du téléchargement audio.'}` 
      }, { quoted: mek });
      
      await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
  }
};
