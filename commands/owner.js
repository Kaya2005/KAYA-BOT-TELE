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
╭─── 💻 *ᴏᴡɴᴇʀ ɪɴғᴏ* ───╮
│
│  *ɴᴀᴍᴇ:* ᴋᴀʏᴀ
│  *ᴄᴏᴜɴᴛʀʏ:* ʀᴅ ᴄᴏɴɢᴏ 🇨🇩
│  *ʟᴏᴄᴀᴛɪᴏɴ:* ʟᴜʙᴜᴍʙᴀsʜɪ
│  *sᴋɪʟʟ:* ғᴜʟʟ-sᴛᴀᴄᴋ
│  *ᴄᴏɴᴛᴀᴄᴛ:* ᴛ.ᴍᴇ/ᴋᴀʏᴀ243
│
╰──────────────────────╯`.trim();

      // Envoi avec le sender pour afficher l'image personnalisée de l'utilisateur
      return await sendWithBotImage(kaya, from, sender, { 
          caption: caption,
          contextInfo: getContextInfo() 
      });

    } catch (err) {
      console.error('❌ owner.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ *ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ.*' }, { quoted: mek });
    }
  }
};
