// ================= commands/allprefix.js =================
import { getSetting, setSetting } from '../setting.js'; 
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';
import { getString } from '../setting/language.js'; // 🌐 Import de la langue

export default {
  name: 'allprefix',
  description: 'Enable or disable multi-prefix mode for the bot',
  category: 'System',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const botId = kaya.user.id.split(':')[0];
      
      const currentState = Boolean(getSetting(botId, 'allPrefix', true));
      const botName = getBotName(mek.sender);

      // ================= SHOW STATUS =================
      if (!args[0]) {
        const content = 
          `*ʙᴏᴛ :* ${botName}\n\n` +
          `• *${getString(botId, 'allPrefixCurrentMode')} :*${currentState ? `✅ ${getString(botId, 'allPrefixEnabled')}` : `❌ ${getString(botId, 'allPrefixDisabled')}`}\n\n` +
          `💡 *${getString(botId, 'allPrefixUsage')} :*\n` +
          `  • \`${prefix}allprefix on\`\n` +
          `  • \`${prefix}allprefix off\``;

        const caption = boxMessage(getString(botId, 'allPrefixStatusTitle'), content, '⚙️');
        
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

      setSetting(botId, 'allPrefix', newState); 

      const updateContent = 
        `*ʙᴏᴛ :* ${botName}\n\n` +
        `• *${getString(botId, 'allPrefixNewMode')} :* ${newState ? `✅ ${getString(botId, 'allPrefixMultiActive')}` : `❌ ${getString(botId, 'allPrefixStrictActive')}`}`;

      const caption = boxMessage(getString(botId, 'allPrefixUpdatedTitle'), updateContent, '✅');

      return await sendWithBotImage(kaya, from, mek.sender, { caption });

    } catch (err) {
      console.error('❌ allprefix.js error:', err);
      const botId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
      return await kaya.sendMessage(from, { 
        text: errorBox(getString(botId, 'allPrefixError')) 
      }, { quoted: mek });
    }
  }
};
