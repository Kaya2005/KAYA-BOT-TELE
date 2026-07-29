import axios from 'axios';
import { getBotName } from '../setting/botAssets.js';

const cooldowns = new Map();

export default {
  name: 'waifu',
  description: '🎨 Random anime art (SFW)',
  category: 'Anime',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);
      
      const now = Date.now();
      const lastUsed = cooldowns.get(sender) || 0;
      
      if (now - lastUsed < 10000) {
        const remaining = Math.ceil((10000 - (now - lastUsed)) / 1000);
        return await kaya.sendMessage(from, { text: `⏳ *Wait ${remaining}s* before using again.` }, { quoted: mek });
      }

      await kaya.sendPresenceUpdate('composing', from);

      // Appel direct et sécurisé sur une API stable
      const res = await axios.get('https://api.waifu.pics/sfw/waifu', { timeout: 10000 });
      const imageUrl = res.data?.url;
      
      if (!imageUrl) {
        return await kaya.sendMessage(from, { text: '❌ Impossible de charger une image.' }, { quoted: mek });
      }

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
