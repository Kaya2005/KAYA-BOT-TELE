import { getContextInfo } from '../setting/contextInfo.js';
import { usageBox, errorBox } from '../setting/theme.js';

export default {
  name: 'revoke',
  alias: ['demote', 'unadmin'],
  description: '🔻 Demotes an admin in the group (silent)',
  category: 'Group',
  group: true,
  admin: true,
  botAdmin: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // 🔹 Suppression du message de commande en silence
      try {
        await kaya.sendMessage(from, { delete: mek.key });
      } catch (e) {
        // Ignorer si le bot n'a pas les droits de suppression
      }

      // 1. Détermination de la cible (Mention ou Reply)
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      const quotedParticipant = mek.message?.extendedTextMessage?.contextInfo?.participant;
      
      let target = mentioned?.[0] || quotedParticipant;

      // 2. Si argument passé (numéro)
      if (!target && args[0]) {
        target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      }

      if (!target) {
        return await kaya.sendMessage(from, { 
          text: usageBox(prefix, 'revoke', '@user or reply to message'),
          contextInfo: getContextInfo() 
        }, { quoted: mek });
      }

      // 3. Exécution de la rétrogradation (Silent - aucun message de confirmation envoyé)
      await kaya.groupParticipantsUpdate(from, [target], 'demote');
      return;

    } catch (err) {
      console.error('❌ revoke.js error:', err);
      return await kaya.sendMessage(from, { 
        text: errorBox('Unable to demote this member.'),
        contextInfo: getContextInfo() 
      }, { quoted: mek });
    }
  }
};
