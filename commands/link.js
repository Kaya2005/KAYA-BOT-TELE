//link.js
import { getBotName } from '../setting/botAssets.js';
import { boxMessage, errorBox } from '../setting/theme.js';

export default {
  name: 'link',
  alias: ['grouplink', 'invite'],
  category: 'Group',
  group: true,
  admin: true,
  botAdmin: true,
  usage: 'link',

  async execute(kaya, mek, from, args, prefix) {
    try {
      // 🔗 Récupération du lien d'invitation
      const code = await kaya.groupInviteCode(from);
      if (!code) {
        return await kaya.sendMessage(from, { 
          text: errorBox('Unable to retrieve the group link.') 
        }, { quoted: mek });
      }
      
      const inviteLink = `https://chat.whatsapp.com/${code}`;

      // 📸 Récupération de la photo du groupe
      let groupImage = null;
      try {
        groupImage = await kaya.profilePictureUrl(from, 'image');
      } catch {
        groupImage = null; 
      }

      const content = `🔗 *Link:* ${inviteLink}\n\n> *Powered by ${getBotName(from)}*`;
      const caption = boxMessage('Group Link', content, '🌐');

      // 🔹 Envoi du lien (avec image si disponible)
      if (groupImage) {
        return await kaya.sendMessage(from, { 
          image: { url: groupImage }, 
          caption: caption 
        }, { quoted: mek });
      } else {
        return await kaya.sendMessage(from, { 
          text: caption 
        }, { quoted: mek });
      }

    } catch (err) {
      console.error('[LINK] Error:', err);
      await kaya.sendMessage(from, { text: errorBox('An error occurred while retrieving the group link.') }, { quoted: mek });
    }
  }
};
