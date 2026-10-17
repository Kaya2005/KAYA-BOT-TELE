// ==================== commands/private.js ====================
import { setSetting } from '../setting.js';
import { usageBox, successBox, errorBox, boxMessage } from '../setting/theme.js';
import { getString } from '../setting/language.js';

export default {
  name: 'private',
  description: 'Set this bot instance to private mode',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Nettoyage de l'ID du bot pour obtenir uniquement la partie numérique
      const botId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
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
          "0": "off"
      };

      const action = actionMap[rawAction];

      if (!rawAction || !action) {
        const usageContent = 
          `${getString(botId, 'privateUsageLabel')}:\n` +
          `• \`${prefix}private on / oui\` (${getString(botId, 'privateOnDesc')})\n` +
          `• \`${prefix}private off / non\` (${getString(botId, 'privateOffDesc')})`;

        return await kaya.sendMessage(from, { 
          text: boxMessage(getString(botId, 'privateMenuTitle'), usageContent, '🔐') 
        }, { quoted: mek });
      }

      const isPrivate = action === 'on';
      // Le réglage est sauvegardé spécifiquement pour cet ID de bot dans son dossier racine
      setSetting(botId, 'privateMode', isPrivate);

      const statusText = isPrivate ? getString(botId, 'mode_on') : getString(botId, 'mode_off');
      const successText = `${getString(botId, 'privateSuccessText')} : *${statusText}*`;

      await kaya.sendMessage(from, { 
        text: successBox(successText) 
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ private.js error:', err);
      const botId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      return await kaya.sendMessage(from, { text: errorBox(getString(botId, 'privateError')) }, { quoted: mek });
    }
  }
};
