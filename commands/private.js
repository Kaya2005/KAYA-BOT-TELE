// ==================== commands/private.js ====================
import { setSetting } from '../setting.js';
import { usageBox, successBox, errorBox, boxMessage } from '../setting/theme.js';

export default {
  name: 'private',
  description: 'Set this bot instance to private mode',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Nettoyage de l'ID du bot pour obtenir uniquement la partie numérique
      const botId = kaya.user.id.split(':')[0];
      const action = args[0]?.toLowerCase();

      if (!action || !['on', 'off'].includes(action)) {
        const usageContent = `Usage:\n• \`${prefix}private on\` (Private mode for this instance)\n• \`${prefix}private off\` (Public mode)`;
        return await kaya.sendMessage(from, { 
          text: boxMessage('Private Mode Settings', usageContent, '🔐') 
        }, { quoted: mek });
      }

      const isPrivate = action === 'on';
      // Le réglage est sauvegardé spécifiquement pour cet ID de bot dans son dossier racine
      setSetting(botId, 'privateMode', isPrivate);

      await kaya.sendMessage(from, { 
        text: successBox(`Private mode for this bot is now: *${isPrivate ? 'ON' : 'OFF'}*`) 
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ private.js error:', err);
      return await kaya.sendMessage(from, { text: errorBox('An error occurred.') }, { quoted: mek });
    }
  }
};
