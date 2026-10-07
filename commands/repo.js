// ==================== commands/repo.js ====================
import { boxMessage, errorBox } from '../setting/theme.js';

export default {
  name: 'repo',
  alias: ['script', 'source'],
  description: 'Shows official bot links',
  category: 'General',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const content = 
        `• *Connect Bot:*\n` +
        `  t.me/kaya243\n\n` +
        `• *WhatsApp Channel:*\n` +
        `  https://whatsapp.com/channel/0029Vb91eHA7Noa7fCn1vp3j\n\n` +
        `• *Status:* Online & Optimized`;

      const message = boxMessage('Official Links', content, '🔗');

      return await kaya.sendMessage(from, { text: message }, { quoted: mek });

    } catch (err) {
      console.error('❌ repo.js error:', err);
      return await kaya.sendMessage(from, { text: errorBox('An error occurred.') }, { quoted: mek });
    }
  }
};
