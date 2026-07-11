// allprefix.js
import { getSetting, setSetting } from '../setting.js'; 
import { getContextInfo } from '../setting/contextInfo.js';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

export default {
  name: 'allprefix',
  description: 'Enable or disable multi-prefix mode for the bot',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const botJid = kaya.user.id; // Clé unique pour ce bot
      // On récupère l'état actuel en fonction du bot
      const currentState = Boolean(getSetting(botJid, 'allPrefix', true));
      const botName = getBotName(mek.sender);

      // ================= SHOW STATUS =================
      if (!args[0]) {
        const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*⚙️ ALL PREFIX STATUS*\n*➡️ Current mode:* ${currentState ? '✅ Enabled' : '❌ Disabled'}\n______________________\n\n💡 *Usage:* \`${prefix}allprefix <on/off>\``;
        
        return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo() });
      }

      // ================= TOGGLE MODE =================
      const option = args[0].toLowerCase();
      let newState;

      if (option === 'on') {
        newState = true;
      } else if (option === 'off') {
        newState = false;
      } else {
        return await kaya.sendMessage(from, { text: '❌ Use `on` to enable or `off` to disable.' }, { quoted: mek });
      }

      // Enregistrement sur le JID du bot pour que cela soit global à cette instance
      setSetting(botJid, 'allPrefix', newState); 

      const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*✅ MODE UPDATED*\n*➡️ New mode:* ${newState ? '✅ Enabled (Multi-prefix)' : '❌ Disabled (Strict prefix only)'}`;

      return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo() });

    } catch (err) {
      console.error('❌ allprefix.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ An error occurred.' }, { quoted: mek });
    }
  }
};
