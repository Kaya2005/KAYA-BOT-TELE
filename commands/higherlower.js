// ================= commands/higherlower.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

const games = new Map();

export default {
  name: 'higherlower',
  description: 'Guess if the next number is higher or lower',
  category: 'Games',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const key = `${from}:${mek.sender}`;

      if (!games.has(key)) {
        const number = Math.floor(Math.random() * 100) + 1;

        games.set(key, {
          current: number,
          score: 0
        });

        return await sendWithBotImage(kaya, from, mek.sender, {
          caption:
`📈 *HIGHER OR LOWER*

━━━━━━━━━━━━━━

Current number:

🎲 *${number}*

The next number will be...

📈 *HIGHER*
or
📉 *LOWER*?

👉 Use:

\`${prefix}higherlower higher\`

or

\`${prefix}higherlower lower\`

😈 Good luck!`
        });
      }

      const choice = args[0]?.toLowerCase();

      if (!['higher', 'lower', 'high', 'low', 'h', 'l'].includes(choice)) {
        return await kaya.sendMessage(from, {
          text:
`❌ Choose:

📈 higher
📉 lower

Example:
${prefix}higherlower higher`
        }, { quoted: mek });
      }

      const game = games.get(key);
      const next = Math.floor(Math.random() * 100) + 1;

      let correct;

      if (next > game.current) {
        correct = ['higher', 'high', 'h'].includes(choice);
      } else if (next < game.current) {
        correct = ['lower', 'low', 'l'].includes(choice);
      } else {
        correct = true;
      }

      if (!correct) {
        const score = game.score;

        games.delete(key);

        return await sendWithBotImage(kaya, from, mek.sender, {
          caption:
`💀 *GAME OVER!*

🎲 Previous: *${game.current}*
🎲 Next: *${next}*

🏆 Final score: *${score}*

${score >= 5
  ? '🔥 Impressive!'
  : '😂 You can do better!'}`
        });
      }

      game.score++;
      game.current = next;

      return await sendWithBotImage(kaya, from, mek.sender, {
        caption:
`🔥 *CORRECT!*

🎲 New number:
*${next}*

🏆 Score: *${game.score}*

So...

📈 *HIGHER*
or
📉 *LOWER*?

👉 \`${prefix}higherlower higher\`
👉 \`${prefix}higherlower lower\``
      });

    } catch (err) {
      console.error('❌ higherlower.js:', err);
    }
  }
};