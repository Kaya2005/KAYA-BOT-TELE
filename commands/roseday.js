import fetch from 'node-fetch';
import { getBotName } from '../setting/botAssets.js';

export default {
  name: 'roseday',
  alias: ['rose'],
  description: 'Génère un message pour la journée des roses',
  category: 'Fun',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);
      const API_KEY = 'prince';
      const res = await fetch(`https://api.princetechn.com/api/fun/roseday?apikey=${API_KEY}`);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API responded with status ${res.status}: ${errText}`);
      }

      const json = await res.json();

      if (!json?.result) {
        throw new Error('API response does not contain result field.');
      }

      const rosedayMessage = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰\n🌹 *Rose Day Message:*\n\n${json.result}`;

      await kaya.sendMessage(from, { text: rosedayMessage }, { quoted: mek });
    } catch (error) {
      console.error('❌ Error in rosedayCommand:', error);
      await kaya.sendMessage(
        from, 
        { text: '❌ Failed to fetch Rose Day quote. Please try again later!' }, 
        { quoted: mek }
      );
    }
  }
};
