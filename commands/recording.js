// recording.js
import { getBotName } from '../setting/botAssets.js';
import { getSetting, setSetting } from '../setting.js';

export default {
  name: 'recording',
  description: 'Enable or disable automatic recording mode',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Nettoyage de l'ID pour la compatibilité avec la hiérarchie userall/
      const ownerId = kaya.user.id.split(':')[0];
      const botName = getBotName(kaya.user.id);
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
        setSetting(ownerId, 'recording', true);
        return await kaya.sendMessage(from, {
          text: `✅ *Recording* mode enabled.`
        }, { quoted: mek });
      }

      if (action === 'off') {
        setSetting(ownerId, 'recording', false);
        return await kaya.sendMessage(from, {
          text: `❌ *Recording* mode disabled.`
        }, { quoted: mek });
      }

      if (action === 'status') {
        const status = getSetting(ownerId, 'recording', false);
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
