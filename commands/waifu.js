import axios from 'axios';
import { getBotName } from '../setting/botAssets.js';

// Stockage temporaire en mémoire pour le cooldown
const cooldowns = new Map();

const SOURCES = [
  'https://api.waifu.pics/sfw/waifu',
  'https://api.waifu.pics/sfw/neko',
  'https://api.waifu.pics/sfw/megumin',
  'https://nekos.best/api/v2/waifu',
  'https://nekos.best/api/v2/neko'
];

async function fetchImage() {
  for (const url of SOURCES) {
    try {
      const res = await axios.get(url, { timeout: 10000 });
      if (res.data?.url) return res.data.url;
      if (res.data?.results?.[0]?.url) return res.data.results[0].url;
    } catch { continue; }
  }
  return null;
}

export default {
  name: 'waifu',
  alias: ['anime'],
  description: '🎨 Random anime art (SFW)',
  category: 'Anime',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);
      
      // Gestion du cooldown en mémoire (10 secondes)
      const now = Date.now();
      const lastUsed = cooldowns.get(sender) || 0;
      
      if (now - lastUsed < 10000) {
        const remaining = Math.ceil((10000 - (now - lastUsed)) / 1000);
        return await kaya.sendMessage(from, { text: `⏳ *Wait ${remaining}s* before using again.` }, { quoted: mek });
      }

      await kaya.sendPresenceUpdate('composing', from);
      const imageUrl = await fetchImage();
      
      if (!imageUrl) {
        return await kaya.sendMessage(from, { text: '❌ Impossible de charger une image.' }, { quoted: mek });
      }

      // Mise à jour du cooldown en mémoire
      cooldowns.set(sender, now);

      const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n🎨 *Anime Art - SFW*`;

      return await kaya.sendMessage(from, { 
        image: { url: imageUrl }, 
        caption 
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ waifu.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ An error occurred.' }, { quoted: mek });
    }
  }
};
