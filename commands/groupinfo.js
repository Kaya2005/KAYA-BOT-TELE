import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import decodeJid from '../setting/decodeJid.js'; 

export default {
  name: 'groupinfo',
  alias: ['infogroup', 'ginfo'],
  description: 'Displays group information',
  category: 'Group',
  group: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender; // Récupération du sender
      const botName = getBotName(sender); // Nom spécifique à l'utilisateur
      const groupMetadata = await kaya.groupMetadata(from);
      const participants = groupMetadata.participants;

      const admins = participants.filter(p => p.admin);
      const adminList = admins
        .map((v, i) => `${i + 1}. @${decodeJid(v.id).split('@')[0]}`)
        .join('\n');

      const rawOwner = groupMetadata.owner || admins.find(v => v.admin === 'superadmin')?.id || from.split('-')[0] + '@s.whatsapp.net';
      const owner = decodeJid(rawOwner);

      let pp;
      try {
        pp = await kaya.profilePictureUrl(from, 'image');
      } catch {
        pp = 'https://i.imgur.com/2wzGhpF.jpeg';
      }

      const caption = `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*👑 GROUP INFO*

*🆔 ID:* ${groupMetadata.id}
*🔖 Name:* ${groupMetadata.subject}
*👥 Members:* ${participants.length}
*🤿 Owner:* @${owner.split('@')[0]}

*🕵🏻‍♂️ Admins:*
${adminList || '• None'}

*📌 Description:*
${groupMetadata.desc || 'No description'}
`.trim();

      // Mise à jour : ajout de 'sender' comme 3ème argument
      return await sendWithBotImage(kaya, from, sender, {
        image: { url: pp },
        caption: caption,
        mentions: [...admins.map(v => v.id), rawOwner]
      });

    } catch (err) {
      console.error('❌ groupinfo.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ Unable to fetch group information.' }, { quoted: mek });
    }
  }
};
