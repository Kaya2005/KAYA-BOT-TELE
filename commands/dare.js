import fetch from 'node-fetch';
import { getBotName } from '../setting/botAssets.js';

export default {
  name: 'dare',
  description: 'Get a random dare from Shizo API',
  category: 'Fun',
  group: false,
  admin: false,
  botAdmin: false,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);
      const shizokeys = 'shizo';
      
      const res = await fetch(`https://shizoapi.onrender.com/api/texts/dare?apikey=${shizokeys}`);

      if (!res.ok) {
        throw await res.text();
      }

      const json = await res.json();
      const dareMessage = json.result;

      const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰\n🔥 *DARE*\n\n${dareMessage}`;

      await kaya.sendMessage(from, { text: caption }, { quoted: mek });

    } catch (error) {
      console.error('❌ Error in dare command:', error);
      await kaya.sendMessage(
        from,
        { text: '❌ Failed to get dare. Please try again later!' },
        { quoted: mek }
      );
    }
  }
};
