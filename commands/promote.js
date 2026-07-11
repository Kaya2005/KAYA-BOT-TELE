import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
  name: 'promote',
  alias: ['admin', 'setadmin'],
  description: '👑 Promouvoir un membre du groupe (silencieux)',
  category: 'Group',
  group: true,
  admin: true,
  botAdmin: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);
      
      // 1. Détermination de la cible (Mention, Reply ou Argument)
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      const quotedParticipant = mek.message?.extendedTextMessage?.contextInfo?.participant;
      
      let target = mentioned?.[0] || quotedParticipant;

      if (!target && args[0]) {
        target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      }

      if (!target) {
        const caption = `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*⚠️ TARGET ERROR*
Please mention the user or reply to their message to promote them.
`.trim();
        // Mise à jour : ajout de 'sender' pour l'image
        return await sendWithBotImage(kaya, from, sender, { 
            caption, 
            contextInfo: getContextInfo() 
        });
      }

      // 2. Exécution de la promotion (Silent)
      await kaya.groupParticipantsUpdate(from, [target], 'promote');

    } catch (err) {
      console.error('❌ promote.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ Unable to promote this member.' }, { quoted: mek });
    }
  }
};
