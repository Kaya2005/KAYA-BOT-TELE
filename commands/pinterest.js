import axios from 'axios';
import { getBotName } from '../setting/botAssets.js';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'okhttp/4.9.3'
];

// Fonction de tentative répétée avec délai exponentiel
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

// Helper pour vérifier si c'est une URL Pinterest
function isPinterestUrl(input) {
  const patterns = [
    /pin\.it\//i,
    /pinterest\.com\/pin\//i,
    /pinterest\.com\/[^/]+\/[^/]+\/?/i
  ];
  return patterns.some(p => p.test(input));
}

// Helper pour trouver la meilleure qualité d'image
function getBestImageUrl(pin) {
  if (pin.image) return pin.image;
  if (pin.images?.orig?.url) return pin.images.orig.url;
  if (pin.images?.original?.url) return pin.images.original.url;
  if (pin.images) {
    const sizes = ['736x', '564x', '474x', '236x', '170x', '136x', '60x60'];
    for (const size of sizes) {
      if (pin.images[size]?.url) return pin.images[size].url;
    }
  }
  return null;
}

export default {
  name: 'pinterest',
  aliases: ['pin', 'pindl'],
  category: 'media',
  description: '📌 Download images from Pinterest (URL or search)',
  usage: '.pinterest <url or search query>',

  async execute(kaya, mek, from, args, prefix) {
    const input = args.join(' ').trim();
    const botName = getBotName(mek.sender);

    if (!input) {
      return await kaya.sendMessage(from, { 
        text: `❌ Please provide a Pinterest URL or search query.\nExample: \`${prefix}pinterest <url or query>\`` 
      }, { quoted: mek });
    }

    try {
      await kaya.sendMessage(from, { react: { text: '⏳', key: mek.key } });

      const apiUrl = `https://backend1.tioo.eu.org/pinterest?url=${encodeURIComponent(input)}`;
      const response = await fetchWithRetry(apiUrl, 3, 15000);
      const data = response.data;

      if (!data?.success || !data?.result) {
        throw new Error(data?.message || 'Invalid API response');
      }

      const result = data.result;
      const isUrl = isPinterestUrl(input);

      if (isUrl) {
        // --- Cas URL unique ---
        const imageUrl = getBestImageUrl(result);
        if (!imageUrl) throw new Error('No image URL found');

        const username = result.user?.username || result.user?.full_name || 'Unknown';
        const caption = `📌 *Pinterest Image*\n👤 *User:* ${username}\n\n> *Powered by ${botName}*`;

        await kaya.sendMessage(from, {
          image: { url: imageUrl },
          caption: caption
        }, { quoted: mek });

        await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });
      } else {
        // --- Cas Recherche ---
        const pins = result.result; 
        if (!Array.isArray(pins) || pins.length === 0) {
          throw new Error('No results found');
        }

        const limited = pins.slice(0, 10);
        let sentCount = 0;

        for (const pin of limited) {
          const imageUrl = getBestImageUrl(pin);
          if (!imageUrl) continue;

          const username = pin.user?.username || pin.user?.full_name || 'Unknown';
          const caption = `📌 *Pinterest Result ${sentCount + 1}*\n👤 *User:* ${username}\n\n> *Powered by ${botName}*`;

          await kaya.sendMessage(from, {
            image: { url: imageUrl },
            caption: caption
          }, { quoted: mek });

          sentCount++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (sentCount === 0) {
          await kaya.sendMessage(from, { text: '❌ No downloadable images found in results.' }, { quoted: mek });
        } else {
          await kaya.sendMessage(from, { text: `✅ Sent ${sentCount} images from Pinterest search.` }, { quoted: mek });
        }
        await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });
      }
    } catch (error) {
      console.error('Pinterest error:', error);
      let errorMsg = '❌ Failed to process.';
      if (error.code === 'ECONNABORTED') errorMsg += ' Request timed out.';
      else errorMsg += ` ${error.message}`;
      
      await kaya.sendMessage(from, { text: errorMsg }, { quoted: mek });
      await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
  }
};
