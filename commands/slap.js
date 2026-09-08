// ================= commands/slap.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

export default {
  name: 'slap',
  description: 'Slap someone 😂',
  category: 'Fun',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const botName = getBotName(mek.sender);
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

      if (!mentioned.length) {
        return await kaya.sendMessage(from, {
          text: `👋 Usage: ${prefix}slap @user`
        }, { quoted: mek });
      }

      const user = `@${mentioned[0].split('@')[0]}`;

      const slaps = [
        `👋 ${user} got slapped into another dimension!`,
        `💥 *SLAP!* ${user} didn't even see it coming!`,
        `😂 KAYA BOT gave ${user} the legendary slap!`,
        `👋 ${user} has been officially slapped!`,
        `🥊 ${user} received a critical hit!`,
        `💀 ${user} got slapped so hard the Wi-Fi disconnected!`,
        `🤣 ${user} has been sent to the shadow realm!`,
        `👋 *BONK!* ${user}, behave yourself!`
      ];

      const message = slaps[Math.floor(Math.random() * slaps.length)];

      const caption = `👋 *SLAP ATTACK*

${message}

⚡ Damage: *${Math.floor(Math.random() * 100) + 1}%*`;

      return await sendWithBotImage(kaya, from, mek.sender, {
        caption,
        mentions: mentioned
      });

    } catch (err) {
      console.error('❌ slap.js:', err);
      return await kaya.sendMessage(from, {
        text: '❌ Something went wrong.'
      }, { quoted: mek });
    }
  }
};