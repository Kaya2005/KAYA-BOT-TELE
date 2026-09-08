// ================= commands/love.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

export default {
  name: 'love',
  description: 'Send some love to someone 💕',
  category: 'Fun',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const botName = getBotName(mek.sender);
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

      if (!mentioned.length) {
        return await kaya.sendMessage(from, {
          text: `💕 Usage: ${prefix}love @user`
        }, { quoted: mek });
      }

      const user = `@${mentioned[0].split('@')[0]}`;

      const love = Math.floor(Math.random() * 101);

      const messages = [
        `🥰 ${user} deserves all the love!`,
        `💕 Someone loves ${user} very much!`,
        `😍 ${user} is officially adorable today!`,
        `❤️ KAYA BOT has sent ${user} a giant hug!`,
        `💖 ${user}, your daily dose of love has arrived!`,
        `🥹 ${user} is too lovable!`,
        `💘 Warning! Too much love detected around ${user}!`
      ];

      const message = messages[Math.floor(Math.random() * messages.length)];

      const caption = `💕 *KAYA LOVE METER*

👤 ${user}

💗 Love level: *${love}%*

${message}

💝 Keep spreading love!`;

      return await sendWithBotImage(kaya, from, mek.sender, {
        caption,
        mentions: mentioned
      });

    } catch (err) {
      console.error('❌ love.js:', err);
      return await kaya.sendMessage(from, {
        text: '❌ Something went wrong.'
      }, { quoted: mek });
    }
  }
};