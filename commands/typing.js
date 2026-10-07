// ==================== commands/typing.js ====================
import { getSetting, setSetting } from '../setting.js';
import { usageBox, successBox, errorBox, boxMessage } from '../setting/theme.js';

export default {
  name: 'typing',
  description: 'Enable or disable automatic typing mode',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Nettoyage de l'ID du bot pour la conformité avec userall/{ownerId}/
      const ownerId = kaya.user.id.split(':')[0];
      const action = args[0]?.toLowerCase();

      if (!['on', 'off', 'status'].includes(action)) {
        return await kaya.sendMessage(from, { 
          text: usageBox(prefix, 'typing', '<on/off/status>') 
        }, { quoted: mek });
      }

      if (action === 'on') {
        setSetting(ownerId, 'typing', true);
        return await kaya.sendMessage(from, { 
          text: successBox('Typing mode enabled.') 
        }, { quoted: mek });
      }

      if (action === 'off') {
        setSetting(ownerId, 'typing', false);
        return await kaya.sendMessage(from, { 
          text: successBox('Typing mode disabled.') 
        }, { quoted: mek });
      }

      if (action === 'status') {
        const status = getSetting(ownerId, 'typing', false);
        const statusText = status ? '✅ ENABLED' : '❌ DISABLED';
        const content = `Typing Mode: ${statusText}`;
        
        return await kaya.sendMessage(from, { 
          text: boxMessage('Typing Status', content, '📊') 
        }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ typing.js error:', err);
      return await kaya.sendMessage(from, { 
        text: errorBox('An error occurred.') 
      }, { quoted: mek });
    }
  }
};
