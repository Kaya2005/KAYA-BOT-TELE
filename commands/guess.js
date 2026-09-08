// ================= commands/guess.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

const games = new Map();

export default {
  name: 'guess',
  description: 'Guess a number between 1 and 100',
  category: 'Games',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const key = `${from}:${mek.sender}`;

      if (!games.has(key)) {
        const number = Math.floor(Math.random() * 100) + 1;

        games.set(key, {
          number,
          attempts: 0
        });

        return await sendWithBotImage(kaya, from, mek.sender, {
          caption:
`🔢 *GUESS THE NUMBER*

I picked a number between *1 and 100* 🤫

🎯 Try to guess it!

Use:
\`${prefix}guess 50\`

Good luck 🍀`
        });
      }

      if (!args[0]) {
        return await kaya.sendMessage(from, {
          text: `🎯 Enter a number!\n\nExample: ${prefix}guess 42`
        }, { quoted: mek });
      }

      const guess = Number(args[0]);
      const game = games.get(key);

      if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
        return await kaya.sendMessage(from, {
          text: '❌ Choose a whole number between 1 and 100.'
        }, { quoted: mek });
      }

      game.attempts++;

      if (guess === game.number) {
        games.delete(key);

        return await sendWithBotImage(kaya, from, mek.sender, {
          caption:
`🎉 *CONGRATULATIONS!*

You found the number *${game.number}*! 🏆

🎯 Attempts: *${game.attempts}*

🔥 ${game.attempts <= 5 ? 'Amazing!' : 'You finally got it 😂'}`
        });
      }

      const hint = guess < game.number
        ? '📈 Go HIGHER!'
        : '📉 Go LOWER!';

      return await kaya.sendMessage(from, {
        text:
`${hint}

🎯 Attempt: ${game.attempts}

Keep going 😈`
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ guess.js:', err);
    }
  }
};