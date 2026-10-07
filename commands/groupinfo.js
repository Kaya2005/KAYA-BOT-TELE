import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import decodeJid from '../setting/decodeJid.js'; 
import { boxMessage, errorBox } from '../setting/theme.js';

export default {
  name: 'groupinfo',
  alias: ['infogroup', 'ginfo'],
  description: 'Displays group information',
  category: 'Group',
  group: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender; // Récupération du sender
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

      const content = `*🆔 ID:* ${groupMetadata.id}\n` +
                      `*🔖 Name:* ${groupMetadata.subject}\n` +
                      `*👥 Members:* ${participants.length}\n` +
                      `*🤿 Owner:* @${owner.split('@')[0]}\n\n` +
                      `*🕵🏻‍♂️ Admins:*\n${adminList || '• None'}\n\n` +
                      `*📌 Description:*\n${groupMetadata.desc || 'No description'}`;

      const caption = boxMessage('Group Info', content, '👑');

      // Mise à jour : ajout de 'sender' comme 3ème argument
      return await sendWithBotImage(kaya, from, sender, {
        image: { url: pp },
        caption: caption,
        mentions: [...admins.map(v => v.id), rawOwner]
      });

    } catch (err) {
      console.error('❌ groupinfo.js error:', err);
      return await kaya.sendMessage(from, { text: errorBox('Unable to fetch group information.') }, { quoted: mek });
    }
  }
};
