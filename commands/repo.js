// ==================== commands/repo.js ====================
import { getBotName } from '../setting/botAssets.js';

export default {
  name: 'repo',
  alias: ['script', 'source'],
  description: 'Shows official bot links',
  category: 'General',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);

      const message = `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*🔗 OFFICIAL LINKS*

connect bot
➠ https://t.me/kayatech2


*💬 WhatsApp Community:*
https://whatsapp.com/channel/0029Vb91eHA7Noa7fCn1vp3j

*🚀 Status:* Online & Optimized
`.trim();

      return await kaya.sendMessage(from, { text: message }, { quoted: mek });

    } catch (err) {
      console.error('❌ repo.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ An error occurred while retrieving links.' }, { quoted: mek });
    }
  }
};
