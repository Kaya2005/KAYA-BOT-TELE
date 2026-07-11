import { getBotName } from '../setting/botAssets.js';
import { getSetting, setSetting } from '../setting.js';

export default {
  name: 'recording',
  description: 'Enable or disable automatic recording mode',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const botJid = kaya.user.id;
      const botName = getBotName(botJid);
      const action = args[0]?.toLowerCase();

      if (!['on', 'off', 'status'].includes(action)) {
        const text = `▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*❌ USAGE ERROR*

Usage:
\`${prefix}recording <on/off/status>\``;

        return await kaya.sendMessage(from, { text }, { quoted: mek });
      }

      if (action === 'on') {
        setSetting(botJid, 'recording', true);

        return await kaya.sendMessage(from, {
          text: `✅ *Recording* mode enabled.`
        }, { quoted: mek });
      }

      if (action === 'off') {
        setSetting(botJid, 'recording', false);

        return await kaya.sendMessage(from, {
          text: `❌ *Recording* mode disabled.`
        }, { quoted: mek });
      }

      if (action === 'status') {
        const status = getSetting(botJid, 'recording', false);

        return await kaya.sendMessage(from, {
          text: `📊 *Recording mode:* ${status ? '✅ ENABLED' : '❌ DISABLED'}`
        }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ recording.js error:', err);

      return await kaya.sendMessage(from, {
        text: '❌ An error occurred.'
      }, { quoted: mek });
    }
  }
};