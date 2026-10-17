// ==================== commands/typing.js ====================
import { getSetting, setSetting } from '../setting.js';
import { usageBox, successBox, errorBox, boxMessage } from '../setting/theme.js';
import { getString } from '../setting/language.js';

export default {
  name: 'typing',
  description: 'Enable or disable automatic typing mode',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Nettoyage de l'ID du bot pour la conformité avec userall/{ownerId}/
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      const rawAction = args[0]?.toLowerCase();

      // 🔄 MAPPING DES SOUS-COMMANDES SELON LA LANGUE (FR/EN)
      const actionMap = {
          "on": "on",
          "oui": "on",
          "yes": "on",
          "1": "on",

          "off": "off",
          "non": "off",
          "no": "off",
          "0": "off",

          "status": "status",
          "statut": "status",
          "etat": "status"
      };

      const action = actionMap[rawAction];

      if (!rawAction || !action) {
        return await kaya.sendMessage(from, { 
          text: usageBox(prefix, 'typing', '<on/off/status>') 
        }, { quoted: mek });
      }

      if (action === 'on') {
        setSetting(ownerId, 'typing', true);
        return await kaya.sendMessage(from, { 
          text: successBox(getString(ownerId, 'typingEnabledMsg')) 
        }, { quoted: mek });
      }

      if (action === 'off') {
        setSetting(ownerId, 'typing', false);
        return await kaya.sendMessage(from, { 
          text: successBox(getString(ownerId, 'typingDisabledMsg')) 
        }, { quoted: mek });
      }

      if (action === 'status') {
        const status = getSetting(ownerId, 'typing', false);
        const statusText = status ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off');
        const content = `${getString(ownerId, 'typingStatusLabel')} : ${statusText}`;
        
        return await kaya.sendMessage(from, { 
          text: boxMessage(getString(ownerId, 'typingMenuTitle'), content, '📊') 
        }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ typing.js error:', err);
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      return await kaya.sendMessage(from, { 
        text: errorBox(getString(ownerId, 'typingError')) 
      }, { quoted: mek });
    }
  }
};
