import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
  name: 'resetlink',
  alias: ['grouplink', 'linkreset'],
  description: 'Resets the group invite link',
  category: 'Group',
  group: true,
  admin: true,
  botAdmin: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);

      // 🔁 Reset the invite link
      await kaya.groupRevokeInvite(from);

      const caption = `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
✅ *GROUP LINK RESET*
The group invite link has been successfully revoked and reset.
`.trim();

      return await sendWithBotImage(kaya, from, sender, { 
          caption,
          contextInfo: getContextInfo() 
      });

    } catch (err) {
      console.error('❌ resetlink.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ An error occurred while resetting the group link.' }, { quoted: mek });
    }
  }
};
