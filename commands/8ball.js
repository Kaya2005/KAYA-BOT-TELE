// ================= commands/8ball.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

export default {
  name: '8ball',
  description: 'Ask the Magic 8-Ball 🎱',
  category: 'Fun',

  async execute(kaya, mek, from, args, prefix) {
    try {
      if (!args.length) {
        return await kaya.sendMessage(from, {
          text: `🎱 *MAGIC 8-BALL*\n\nAsk me a question!\n\nExample:\n${prefix}8ball Will I become rich?`
        }, { quoted: mek });
      }

      const answers = [
        '🟢 Absolutely YES!',
        '🟢 100% YES!',
        '🟢 Definitely!',
        '🟢 The future says YES!',
        '🟡 Probably...',
        '🟡 Maybe 👀',
        '🟡 Ask me again later.',
        '🟠 I have no idea 😂',
        '🔴 Probably not...',
        '🔴 NO!',
        '🔴 Absolutely NOT! 💀',
        '💀 Bro... you already know the answer.'
      ];

      const question = args.join(' ');
      const answer = answers[Math.floor(Math.random() * answers.length)];

      const caption = `🎱 *MAGIC 8-BALL*

❓ *Question:*
${question}

🔮 *Answer:*
${answer}`;

      return await sendWithBotImage(kaya, from, mek.sender, {
        caption
      });

    } catch (err) {
      console.error('❌ 8ball.js:', err);
      return await kaya.sendMessage(from, {
        text: '❌ Something went wrong.'
      }, { quoted: mek });
    }
  }
};