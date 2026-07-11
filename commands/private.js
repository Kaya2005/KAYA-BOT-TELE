// ==================== commands/private.js ====================
import { setSetting } from '../setting.js';

export default {
  name: 'private',
  description: 'Set this bot instance to private mode',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const botJid = kaya.user.id; // Identifiant unique de cette instance
      const action = args[0]?.toLowerCase();

      if (!action || !['on', 'off'].includes(action)) {
        return await kaya.sendMessage(from, { 
          text: `🔐 *PRIVATE MODE SETTINGS*\n\nUsage:\n• \`${prefix}private on\` (Private mode for this instance)\n• \`${prefix}private off\` (Public mode)` 
        }, { quoted: mek });
      }

      const isPrivate = action === 'on';
      // Le réglage est sauvegardé spécifiquement pour cet ID de bot
      setSetting(botJid, 'privateMode', isPrivate);

      await kaya.sendMessage(from, { 
        text: `✅ Private mode for this bot is now: *${isPrivate ? 'ON' : 'OFF'}*` 
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ private.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ An error occurred.' }, { quoted: mek });
    }
  }
};
