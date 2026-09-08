// ================= commands/hug.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

export default {
  name: 'hug',
  description: 'Give someone a warm hug 🤗',
  category: 'Fun',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

      if (!mentioned.length) {
        return await kaya.sendMessage(from, {
          text: `🤗 Usage: ${prefix}hug @user`
        }, { quoted: mek });
      }

      const user = `@${mentioned[0].split('@')[0]}`;

      const hugs = [
        `🫂 ${user} received the biggest hug ever!`,
        `🤗 KAYA BOT gives ${user} a warm hug!`,
        `💕 ${user} has been hugged!`,
        `🥰 ${user} is now protected by the power of friendship!`,
        `🫂 *HUG ATTACK!* ${user} cannot escape!`,
        `🤗 Sending infinite hugs to ${user}!`,
        `💖 ${user} just received a legendary hug!`
      ];

      const message = hugs[Math.floor(Math.random() * hugs.length)];

      const caption = `🤗 *HUG ZONE*

${message}

🫂 Hug power: *${Math.floor(Math.random() * 100) + 1}%*`;

      return await sendWithBotImage(kaya, from, mek.sender, {
        caption,
        mentions: mentioned
      });

    } catch (err) {
      console.error('❌ hug.js:', err);
      return await kaya.sendMessage(from, {
        text: '❌ Something went wrong.'
      }, { quoted: mek });
    }
  }
};