// typing.js
import { getBotName } from '../setting/botAssets.js';
import { getSetting, setSetting } from '../setting.js';

export default {
  name: 'typing',
  description: 'Enable or disable automatic typing mode',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Nettoyage de l'ID du bot pour la conformité avec userall/{ownerId}/
      const ownerId = kaya.user.id.split(':')[0];
      const botName = getBotName(kaya.user.id);
      const action = args[0]?.toLowerCase();

      if (!['on', 'off', 'status'].includes(action)) {
        const text = `▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*❌ USAGE ERROR*

Usage:
\`${prefix}typing <on/off/status>\``;

        return await kaya.sendMessage(from, { text }, { quoted: mek });
      }

      if (action === 'on') {
        setSetting(ownerId, 'typing', true);
        return await kaya.sendMessage(from, {
          text: `✅ *Typing* mode enabled.`
        }, { quoted: mek });
      }

      if (action === 'off') {
        setSetting(ownerId, 'typing', false);
        return await kaya.sendMessage(from, {
          text: `❌ *Typing* mode disabled.`
        }, { quoted: mek });
      }

      if (action === 'status') {
        const status = getSetting(ownerId, 'typing', false);
        return await kaya.sendMessage(from, {
          text: `📊 *Typing mode:* ${status ? '✅ ENABLED' : '❌ DISABLED'}`
        }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ typing.js error:', err);
      return await kaya.sendMessage(from, {
        text: '❌ An error occurred.'
      }, { quoted: mek });
    }
  }
};
