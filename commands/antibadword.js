import { getSetting, setSetting } from "../setting.js";

const badWords = [
  'fuck', 'bitch', 'asshole', 'nigga', 'shit',
  'merde', 'connard', 'salaud', 'putain', 'enfoiré'
];

// Messages FR/EN
function getMessage(key, sender, lang = 'en', n = 0) {
  const msgs = {
    notGroup: { fr: '❌ Commande réservée aux groupes', en: '❌ Group only command' },
    notAdmin: { fr: '❌ Seulement pour les admins', en: '❌ Admins only' },
    menu: { 
      fr: '📛 *MENU ANTIBADWORD*\n.antibadword on\n.antibadword off\n.antibadword set delete|kick|warn',
      en: '📛 *ANTIBADWORD MENU*\n.antibadword on\n.antibadword off\n.antibadword set delete|kick|warn'
    },
    enabled: { fr: '✅ AntiBadword activé', en: '✅ AntiBadword enabled' },
    disabled: { fr: '❌ AntiBadword désactivé', en: '❌ AntiBadword disabled' },
    setAction: (action) => ({ fr: `✅ Action définie sur *${action}*`, en: `✅ Action set to *${action}*` }),
    badWords: (sender) => ({ fr: `⚠️ @${sender.split('@')[0]} mots interdits ici`, en: `⚠️ @${sender.split('@')[0]} bad words not allowed` }),
    warning: (sender, n) => ({ fr: `⚠️ @${sender.split('@')[0]} avertissement ${n}/3`, en: `⚠️ @${sender.split('@')[0]} warning ${n}/3` })
  };
  
  if (key === 'setAction') return msgs[key](sender)[lang];
  if (key === 'badWords') return msgs[key](sender)[lang];
  if (key === 'warning') return msgs[key](sender, n)[lang];
  return msgs[key][lang] || msgs[key].en;
}

export default {
  name: 'antibadword',
  description: 'Active/configure AntiBadword (FR/EN)',
  category: 'Group',

  run: async (kaya, m, args, lang = 'en') => {
    try {
      if (!m.isGroup) return kaya.sendMessage(m.chat, { text: getMessage('notGroup', null, lang) }, { quoted: m });

      const sender = m.sender;
      const groupId = m.chat.split('@')[0];
      const ownerId = kaya.user.id.split(':')[0];

      const metadata = await kaya.groupMetadata(m.chat);
      const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
      if (!admins.includes(sender)) return kaya.sendMessage(m.chat, { text: getMessage('notAdmin', null, lang) }, { quoted: m });

      const option = args[0];
      if (!option) return kaya.sendMessage(m.chat, { text: getMessage('menu', null, lang) }, { quoted: m });

      if (option === 'on') {
        setSetting(ownerId, 'antibadword', { enabled: true, action: 'delete' }, groupId);
        return kaya.sendMessage(m.chat, { text: getMessage('enabled', null, lang) }, { quoted: m });
      }
      if (option === 'off') {
        setSetting(ownerId, 'antibadword', { enabled: false, action: 'delete' }, groupId);
        return kaya.sendMessage(m.chat, { text: getMessage('disabled', null, lang) }, { quoted: m });
      }

      if (option === 'set') {
        const action = args[1];
        if (!['delete', 'kick', 'warn'].includes(action)) {
          return kaya.sendMessage(m.chat, { text: '❌ Choose: delete | kick | warn' }, { quoted: m });
        }
        setSetting(ownerId, 'antibadword', { enabled: true, action: action }, groupId);
        return kaya.sendMessage(m.chat, { text: getMessage('setAction', action, lang) }, { quoted: m });
      }
    } catch (err) {
      console.error('❌ Error antibadword:', err);
    }
  },

  detect: async (kaya, m, lang = 'en') => {
    try {
      if (!m.isGroup || !m.body) return;
      const groupId = m.chat.split('@')[0];
      const ownerId = kaya.user.id.split(':')[0];
      
      const config = getSetting(ownerId, 'antibadword', { enabled: false, action: 'delete' }, groupId);
      if (!config.enabled) return;

      const text = m.body.toLowerCase();
      if (!badWords.some(w => text.includes(w))) return;

      const sender = m.sender;
      await kaya.sendMessage(m.chat, { delete: m.key });

      if (config.action === 'kick') {
        await kaya.groupParticipantsUpdate(m.chat, [sender], 'remove');
      } else if (config.action === 'warn') {
        const warnKey = `warn_badword_${sender}`;
        const currentWarns = getSetting(ownerId, warnKey, 0, groupId);
        const newWarns = currentWarns + 1;
        
        if (newWarns >= 3) {
          await kaya.groupParticipantsUpdate(m.chat, [sender], 'remove');
          setSetting(ownerId, warnKey, 0, groupId);
        } else {
          setSetting(ownerId, warnKey, newWarns, groupId);
          await kaya.sendMessage(m.chat, { text: getMessage('warning', sender, lang, newWarns), mentions: [sender] });
        }
      } else {
        await kaya.sendMessage(m.chat, { text: getMessage('badWords', sender, lang), mentions: [sender] });
      }
    } catch (e) {
      console.error('❌ Badword detection error:', e);
    }
  }
};
