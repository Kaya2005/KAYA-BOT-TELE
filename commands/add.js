// ================= commands/add.js =================
import { getContextInfo } from '../setting/contextInfo.js';

export default {
  name: 'add',
  description: 'Add a member to a group (Owner only)',
  category: 'Group',
  group: true,

  async execute(Kaya, m, args) {
    try {
      // ❌ Group only
      if (!m.isGroup) return; 
      
      // 🔐 Owner only
      if (!m.fromMe) return;

      // 📞 Clean number
      const number = args[0] ? args[0].replace(/[^0-9]/g, '') : '';
      if (!number) {
        return Kaya.sendMessage(m.chat, { text: '❌ Usage: .add 243XXXXXXXXX' }, { quoted: m });
      }

      const jid = `${number}@s.whatsapp.net`;

      // ➕ Add participant
      const response = await Kaya.groupParticipantsUpdate(m.chat, [jid], 'add');

      // 📝 Analyze WhatsApp response
      if (response[0].status === '403') {
        return Kaya.sendMessage(m.chat, { text: '❌ Failed: The bot is not an admin or the user has restricted group invites.' }, { quoted: m });
      } else if (response[0].status === '409') {
        return Kaya.sendMessage(m.chat, { text: '⚠️ The user is already in the group.' }, { quoted: m });
      }

    } catch (err) {
      console.error('❌ ADD ERROR:', err);
      await Kaya.sendMessage(m.chat, { text: '❌ Error: Unable to add this member.' }, { quoted: m });
    }
  }
};
