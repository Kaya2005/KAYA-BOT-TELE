// ================= commands/rps.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

export default {
  name: 'rps',
  description: 'Play Rock Paper Scissors',
  category: 'Games',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const botName = getBotName(mek.sender);

      const choices = ['rock', 'paper', 'scissors'];
      const emojis = {
        rock: '🪨',
        paper: '📄',
        scissors: '✂️'
      };

      const player = args[0]?.toLowerCase();

      if (!player || !choices.includes(player)) {
        return await sendWithBotImage(kaya, from, mek.sender, {
          caption:
`🎮 *${botName} — ROCK PAPER SCISSORS*

Choose your weapon 😈

🪨 *rock*
📄 *paper*
✂️ *scissors*

👉 Example:
\`${prefix}rps rock\`

Good luck... 😏`
        });
      }

      const bot = choices[Math.floor(Math.random() * choices.length)];

      let result;

      if (player === bot) {
        result = `🤝 *DRAW!*\n\nWe both chose ${emojis[bot]}`;
      } else if (
        (player === 'rock' && bot === 'scissors') ||
        (player === 'paper' && bot === 'rock') ||
        (player === 'scissors' && bot === 'paper')
      ) {
        result =
`🏆 *YOU WIN!*

${emojis[player]} You
${emojis[bot]} Me

🔥 Well played!`;
      } else {
        result =
`💀 *YOU LOST!*

${emojis[player]} You
${emojis[bot]} Me

😂 Try again!`;
      }

      return await sendWithBotImage(kaya, from, mek.sender, {
        caption:
`🎮 *RPS BATTLE*

━━━━━━━━━━━━━━

${result}

━━━━━━━━━━━━━━
⚡ ${botName}`
      });

    } catch (err) {
      console.error('❌ rps.js:', err);
    }
  }
};