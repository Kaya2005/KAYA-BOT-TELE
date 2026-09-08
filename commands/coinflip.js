// ================= commands/coinflip.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

export default {
  name: 'coinflip',
  description: 'Flip a coin 🪙',
  category: 'Fun',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const result = Math.random() < 0.5 ? 'HEADS' : 'TAILS';

      let message;

      if (result === 'HEADS') {
        message = [
          '🤑 HEADS! The universe is on your side!',
          '🔥 HEADS! Lucky you!',
          '😎 HEADS! That was clean!',
          '😂 HEADS! The coin chose you!'
        ];
      } else {
        message = [
          '💀 TAILS! Better luck next time!',
          '😂 TAILS! The coin betrayed you!',
          '🤣 TAILS! The universe said NO!',
          '😈 TAILS! Maybe try again!'
        ];
      }

      const finalMessage =
        message[Math.floor(Math.random() * message.length)];

      const caption = `🪙 *KAYA COIN FLIP*

🪙 The coin is spinning...

━━━━━━━━━━━━━━

🎯 *RESULT:* ${result}

${finalMessage}`;

      return await sendWithBotImage(kaya, from, mek.sender, {
        caption
      });

    } catch (err) {
      console.error('❌ coinflip.js:', err);
      return await kaya.sendMessage(from, {
        text: '❌ Something went wrong.'
      }, { quoted: mek });
    }
  }
};