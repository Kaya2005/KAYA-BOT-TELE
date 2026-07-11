import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
  name: 'owner',
  alias: ['dev', 'creator'],
  description: 'Shows information about the bot developer',
  category: 'General',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);
      
      const caption = `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*👨‍💻 BOT OWNER INFORMATION*

*👤 Name:* KAYA
*🎂 Age:* 21 years
*🌍 Country:* RD Congo 🇨🇩
*📍 Location:* Lubumbashi
*💻 Skill:* Full-stack Developer

*Contact:* https://wa.me/243999585890

*Note:* Feel free to contact the owner for support or business inquiries.
`.trim();

      // Envoi avec le sender pour afficher l'image personnalisée de l'utilisateur
      return await sendWithBotImage(kaya, from, sender, { 
          caption: caption,
          contextInfo: getContextInfo() 
      });

    } catch (err) {
      console.error('❌ owner.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ An error occurred.' }, { quoted: mek });
    }
  }
};
