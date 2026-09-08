// ================= commands/memory.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

const games = new Map();

export default {
  name: 'memory',
  description: 'Test your memory with numbers',
  category: 'Games',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const key = `${from}:${mek.sender}`;

      if (!games.has(key)) {
        const sequence = Array.from(
          { length: 5 },
          () => Math.floor(Math.random() * 10)
        ).join('');

        games.set(key, { sequence });

        return await sendWithBotImage(kaya, from, mek.sender, {
          caption:
`🧠 *MEMORY CHALLENGE*

Memorize this sequence:

🔢 *${sequence}*

⏱️ You have a few seconds...

Then use:
\`${prefix}memory ${sequence}\`

😈 Don't cheat!`
        });
      }

      const answer = args.join('');
      const game = games.get(key);

      games.delete(key);

      if (answer === game.sequence) {
        return await sendWithBotImage(kaya, from, mek.sender, {
          caption:
`🧠 *MEMORY MASTER!*

🎉 Correct!

🔢 ${game.sequence}

🏆 Your memory is insane 😂`
        });
      }

      return await kaya.sendMessage(from, {
        text:
`❌ Wrong!

The sequence was:
*${game.sequence}* 😭`
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ memory.js:', err);
    }
  }
};