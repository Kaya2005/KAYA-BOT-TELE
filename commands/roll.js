// ================= commands/roll.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

export default {
  name: 'roll',
  description: 'Roll a dice 🎲',
  category: 'Fun',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const result = Math.floor(Math.random() * 6) + 1;

      const dice = {
        1: '⚀',
        2: '⚁',
        3: '⚂',
        4: '⚃',
        5: '⚄',
        6: '⚅'
      };

      let message;

      if (result === 6) {
        message = '🔥 JACKPOT! You rolled the maximum!';
      } else if (result === 1) {
        message = '💀 Ouch... the dice betrayed you!';
      } else if (result >= 4) {
        message = '😎 Nice roll!';
      } else {
        message = '😂 Better luck next time!';
      }

      const caption = `🎲 *KAYA DICE*

${dice[result]}

🎯 *Result:* ${result}

${message}`;

      return await sendWithBotImage(kaya, from, mek.sender, {
        caption
      });

    } catch (err) {
      console.error('❌ roll.js:', err);
      return await kaya.sendMessage(from, {
        text: '❌ Something went wrong.'
      }, { quoted: mek });
    }
  }
};