// ================= commands/math.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

const games = new Map();

export default {
  name: 'math',
  description: 'Solve a math challenge',
  category: 'Games',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const key = `${from}:${mek.sender}`;

      if (!games.has(key)) {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;

        const operations = ['+', '-', '×'];
        const op = operations[Math.floor(Math.random() * operations.length)];

        let answer;

        if (op === '+') answer = a + b;
        if (op === '-') answer = a - b;
        if (op === '×') answer = a * b;

        games.set(key, { answer });

        return await sendWithBotImage(kaya, from, mek.sender, {
          caption:
`🧮 *MATH CHALLENGE*

Think fast! 🧠💥

How much is:

*${a} ${op} ${b} = ?*

👉 Answer with:
\`${prefix}math answer\`

Let's see your level 😈`
        });
      }

      const answer = Number(args[0]);

      if (!Number.isFinite(answer)) {
        return await kaya.sendMessage(from, {
          text: `❌ Answer with a number.\n\nExample: ${prefix}math 25`
        }, { quoted: mek });
      }

      const game = games.get(key);

      if (answer === game.answer) {
        games.delete(key);

        return await sendWithBotImage(kaya, from, mek.sender, {
          caption:
`🎉 *CORRECT!*

🧠 Your brain is working 😂

🏆 Answer: *${game.answer}*

🔥 GG!`
        });
      }

      return await kaya.sendMessage(from, {
        text: `❌ *WRONG!* 😭\n\nTry again!`
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ math.js:', err);
    }
  }
};