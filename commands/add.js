// ================= commands/add.js =================
import { successBox, errorBox, usageBox, boxMessage } from '../setting/theme.js';
import { getString } from '../setting/language.js'; // 🌐 1. Import du module de langue

export default {
  name: 'add',
  description: 'Add a member to a group (Owner only)',
  category: 'Group',
  group: true,

  async execute(Kaya, m, args, prefix) {
    try {
      // ❌ Group only
      if (!m.isGroup) return; 
      
      // 🔐 Owner only
      if (!m.fromMe) return;

      // 🆔 Récupération de l'ID du propriétaire du bot
      const ownerId = Kaya.user?.id ? Kaya.user.id.split(':')[0] : '';

      // 📞 Clean number
      const number = args[0] ? args[0].replace(/[^0-9]/g, '') : '';
      if (!number) {
        return Kaya.sendMessage(m.chat, { 
          text: usageBox(prefix || '.', 'add', '243XXXXXXXXX') 
        }, { quoted: m });
      }

      const jid = `${number}@s.whatsapp.net`;

      // ➕ Add participant
      const response = await Kaya.groupParticipantsUpdate(m.chat, [jid], 'add');

      // 📝 Analyze WhatsApp response
      if (response[0].status === '403') {
        const text = getString(ownerId, 'addRestricted');
        
        return Kaya.sendMessage(m.chat, { 
          text: errorBox(text) 
        }, { quoted: m });
        
      } else if (response[0].status === '409') {
        const text = getString(ownerId, 'addAlreadyInGroup');
        
        return Kaya.sendMessage(m.chat, { 
          text: boxMessage('warning', text, '⚠️') 
        }, { quoted: m });
        
      } else {
        return Kaya.sendMessage(m.chat, { 
          text: successBox(getString(ownerId, 'addSuccess')) 
        }, { quoted: m });
      }

    } catch (err) {
      console.error('❌ ADD ERROR:', err);
      const ownerId = Kaya.user?.id ? Kaya.user.id.split(':')[0] : '';
      await Kaya.sendMessage(m.chat, { 
        text: errorBox(getString(ownerId, 'addError')) 
      }, { quoted: m });
    }
  }
};
