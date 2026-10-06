//link.js
import { getBotName } from '../setting/botAssets.js';

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
          text: '❌ Unable to retrieve the group link.' 
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

      const caption = `🔗 *Group Link* :\n${inviteLink}\n\n© ${getBotName(from)}`;

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
      await kaya.sendMessage(from, { text: '❌ An error occurred while retrieving the group link.' }, { quoted: mek });
    }
  }
};
