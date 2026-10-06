import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

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
      const sender = mek.sender;
      const botName = getBotName(sender);
      
      // 1. Détermination de la cible (Mention ou Reply)
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      const quotedParticipant = mek.message?.extendedTextMessage?.contextInfo?.participant;
      
      let target = mentioned?.[0] || quotedParticipant;

      // 2. Si argument passé (numéro)
      if (!target && args[0]) {
        target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      }

      if (!target) {
        const caption = `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*⚠️ TARGET ERROR*
Please mention the user or reply to their message to demote them.
`.trim();
        // Mise à jour : ajout de 'sender' pour charger l'image personnalisée en cas d'erreur
        return await sendWithBotImage(kaya, from, sender, { 
            caption, 
            contextInfo: getContextInfo() 
        });
      }

      // 3. Exécution de la rétrogradation (Silent)
      await kaya.groupParticipantsUpdate(from, [target], 'demote');

      // Pas de message de succès pour garder le côté "silent"
      return;

    } catch (err) {
      console.error('❌ revoke.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ Unable to demote this member.' }, { quoted: mek });
    }
  }
};
