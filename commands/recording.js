// recording.js
import { getBotName } from '../setting/botAssets.js';
import { getSetting, setSetting } from '../setting.js';
import { usageBox, successBox, errorBox, boxMessage } from '../setting/theme.js';

export default {
  name: 'recording',
  description: 'Enable or disable automatic recording mode',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Nettoyage de l'ID pour la compatibilité avec la hiérarchie userall/
      const ownerId = kaya.user.id.split(':')[0];
      const action = args[0]?.toLowerCase();

      if (!['on', 'off', 'status'].includes(action)) {
        return await kaya.sendMessage(from, { 
          text: usageBox(prefix, 'recording', '<on/off/status>') 
        }, { quoted: mek });
      }

      if (action === 'on') {
        setSetting(ownerId, 'recording', true);
        return await kaya.sendMessage(from, {
          text: successBox("Recording mode enabled.")
        }, { quoted: mek });
      }

      if (action === 'off') {
        setSetting(ownerId, 'recording', false);
        return await kaya.sendMessage(from, {
          text: successBox("Recording mode disabled.")
        }, { quoted: mek });
      }

      if (action === 'status') {
        const status = getSetting(ownerId, 'recording', false);
        const content = `Recording mode: ${status ? '✅ ENABLED' : '❌ DISABLED'}`;
        return await kaya.sendMessage(from, {
          text: boxMessage('Recording Status', content, '📊')
        }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ recording.js error:', err);
      return await kaya.sendMessage(from, {
        text: errorBox('An error occurred.')
      }, { quoted: mek });
    }
  }
};
