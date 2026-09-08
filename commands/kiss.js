// ================= commands/kiss.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

export default {
  name: 'kiss',
  description: 'Give someone a kiss 😘',
  category: 'Fun',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

      if (!mentioned.length) {
        return await kaya.sendMessage(from, {
          text: `😘 Usage: ${prefix}kiss @user`
        }, { quoted: mek });
      }

      const user = `@${mentioned[0].split('@')[0]}`;

      const kisses = [
        `😘 ${user} received a sweet kiss!`,
        `💋  sends a kiss to ${user}!`,
        `🥰 *MUAH!* ${user} caught a kiss!`,
        `😘 Incoming kiss detected... *MWAH!*`,
        `💖 ${user} just got kissed!`,
        `😂 ${user} wasn't ready for that kiss!`,
        `💋 Critical kiss damage dealt to ${user}!`
      ];

      const message = kisses[Math.floor(Math.random() * kisses.length)];

      const caption = `😘 *KISS ATTACK*

${message}

💋 Kiss power: *${Math.floor(Math.random() * 100) + 1}%*`;

      return await sendWithBotImage(kaya, from, mek.sender, {
        caption,
        mentions: mentioned
      });

    } catch (err) {
      console.error('❌ kiss.js:', err);
      return await kaya.sendMessage(from, {
        text: '❌ Something went wrong.'
      }, { quoted: mek });
    }
  }
};