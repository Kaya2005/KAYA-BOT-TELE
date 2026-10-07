// ================= commands/allprefix.js =================
import { getSetting, setSetting } from '../setting.js'; 
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';

export default {
  name: 'allprefix',
  description: 'Enable or disable multi-prefix mode for the bot',
  category: 'System',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Nettoyage de l'ID du bot pour obtenir uniquement la partie numérique (ex: 243...)
      const botId = kaya.user.id.split(':')[0];
      
      // On récupère l'état actuel en fonction de cet ID
      const currentState = Boolean(getSetting(botId, 'allPrefix', true));
      const botName = getBotName(mek.sender);

      // ================= SHOW STATUS =================
      if (!args[0]) {
        const content = 
          `*ʙᴏᴛ :* ${botName}\n\n` +
          `• *ᴄᴜʀʀᴇɴᴛ ᴍᴏᴅᴇ :* ${currentState ? '✅ ᴇɴᴀʙʟᴇᴅ' : '❌ ᴅɪsᴀʙʟᴇᴅ'}\n\n` +
          `💡 *ᴜsᴀɢᴇ :*\n` +
          `  • \`${prefix}allprefix on\`\n` +
          `  • \`${prefix}allprefix off\``;

        const caption = boxMessage('all prefix status', content, '⚙️');
        
        return await sendWithBotImage(kaya, from, mek.sender, { caption });
      }

      // ================= TOGGLE MODE =================
      const option = args[0].toLowerCase();
      let newState;

      if (option === 'on') {
        newState = true;
      } else if (option === 'off') {
        newState = false;
      } else {
        return await kaya.sendMessage(from, { 
          text: usageBox(prefix, 'allprefix', '<on/off>') 
        }, { quoted: mek });
      }

      // Enregistrement sur l'ID numérique du bot (à la racine de son dossier)
      setSetting(botId, 'allPrefix', newState); 

      const updateContent = 
        `*ʙᴏᴛ :* ${botName}\n\n` +
        `• *ɴᴇᴡ ᴍᴏᴅᴇ :* ${newState ? '✅ ᴇɴᴀʙʟᴇᴅ (ᴍᴜʟᴛɪ-ᴘʀᴇғɪx)' : '❌ ᴅɪsᴀʙʟᴇᴅ (sᴛʀɪᴄᴛ)'}`;

      const caption = boxMessage('mode updated', updateContent, '✅');

      return await sendWithBotImage(kaya, from, mek.sender, { caption });

    } catch (err) {
      console.error('❌ allprefix.js error:', err);
      return await kaya.sendMessage(from, { 
        text: errorBox('ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ.') 
      }, { quoted: mek });
    }
  }
};
