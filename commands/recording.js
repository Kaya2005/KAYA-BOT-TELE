// recording.js
import { getBotName } from '../setting/botAssets.js';
import { getSetting, setSetting } from '../setting.js';
import { usageBox, successBox, errorBox, boxMessage } from '../setting/theme.js';
import { getString } from '../setting/language.js';

export default {
  name: 'recording',
  description: 'Enable or disable automatic recording mode',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Nettoyage de l'ID pour la compatibilité avec la hiérarchie userall/
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
          text: usageBox(prefix, 'recording', '<on/off/status>') 
        }, { quoted: mek });
      }

      if (action === 'on') {
        setSetting(ownerId, 'recording', true);
        return await kaya.sendMessage(from, {
          text: successBox(getString(ownerId, 'recordingEnabledMsg'))
        }, { quoted: mek });
      }

      if (action === 'off') {
        setSetting(ownerId, 'recording', false);
        return await kaya.sendMessage(from, {
          text: successBox(getString(ownerId, 'recordingDisabledMsg'))
        }, { quoted: mek });
      }

      if (action === 'status') {
        const status = getSetting(ownerId, 'recording', false);
        const statusText = status ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off');
        const content = `${getString(ownerId, 'recordingStatusLabel')} : ${statusText}`;
        return await kaya.sendMessage(from, {
          text: boxMessage(getString(ownerId, 'recordingMenuTitle'), content, '📊')
        }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ recording.js error:', err);
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      return await kaya.sendMessage(from, {
        text: errorBox(getString(ownerId, 'recordingError'))
      }, { quoted: mek });
    }
  }
};
