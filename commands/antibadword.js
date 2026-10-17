// antibadword.js
import { getSetting, setSetting } from "../setting.js";
import { boxMessage, errorBox, successBox } from "../setting/theme.js";
import { getString } from "../setting/language.js";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const badWords = [
  'fuck', 'bitch', 'asshole', 'nigga', 'shit',
  'merde', 'connard', 'salaud', 'putain', 'enfoiré',
  'sexe', 'porno', 'porn', 'sex', 'nude', 'nudes',
  'bite', 'chatte', 'enculé', 'pute', 'salope'
];

export default {
  name: 'antibadword',
  description: 'Anti-badword system',
  category: 'Group',
  group: true,
  admin: true,
  botAdmin: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const action = args[0]?.toLowerCase();
      const groupId = from.split('@')[0];
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

      if (!["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
        const menuContent = 
          `• \`${prefix}antibadword on\` *(${getString(ownerId, 'antiBadWordDefaultDelete')})*\n` +
          `• \`${prefix}antibadword delete\`\n` +
          `• \`${prefix}antibadword warn\`\n` +
          `• \`${prefix}antibadword kick\`\n` +
          `• \`${prefix}antibadword off\`\n` +
          `• \`${prefix}antibadword status\``;

        return await kaya.sendMessage(from, { 
          text: boxMessage(getString(ownerId, 'antiBadWordMenuTitle'), menuContent, '📛') 
        }, { quoted: mek });
      }

      if (action === "status") {
        const config = getSetting(ownerId, 'antibadword', { enabled: false, action: 'delete' }, groupId);
        
        const modeTranslationKey = `mode_${config.action}`;
        const translatedMode = getString(ownerId, modeTranslationKey);

        const statusContent = !config.enabled 
          ? getString(ownerId, 'antiBadWordDisabledMsg')
          : `• *${getString(ownerId, 'antiBadWordStatusLabel')} :* ${getString(ownerId, 'mode_on')}\n• *${getString(ownerId, 'antiBadWordModeLabel')} :* ${translatedMode}`;

        return await kaya.sendMessage(from, { 
          text: boxMessage(getString(ownerId, 'antiBadWordStatusTitle'), statusContent, '📊') 
        }, { quoted: mek });
      }

      if (action === "off") {
        setSetting(ownerId, 'antibadword', { enabled: false, action: 'delete' }, groupId);
        return await kaya.sendMessage(from, { 
          text: boxMessage('anti-badword', getString(ownerId, 'antiBadWordOffMsg'), '❌') 
        }, { quoted: mek });
      }

      // Activer ou changer de mode
      const mode = action === "on" ? "delete" : action;
      setSetting(ownerId, 'antibadword', { enabled: true, action: mode }, groupId);
      
      const modeTranslationKey = `mode_${mode}`;
      const translatedMode = getString(ownerId, modeTranslationKey);

      const successContent = `${getString(ownerId, 'antiBadWordEnabledWithMode')}\n*${translatedMode}*`;
      await kaya.sendMessage(from, { 
        text: successBox(successContent) 
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ Error antibadword execute:', err);
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      await kaya.sendMessage(from, { text: errorBox(getString(ownerId, 'antiBadWordError')) }, { quoted: mek });
    }
  },

  async detect(kaya, mek, from, body) {
    try {
      const groupId = from.split('@')[0];
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      
      const config = getSetting(ownerId, 'antibadword', { enabled: false, action: 'delete' }, groupId);
      if (!config.enabled || mek.key?.fromMe) return;

      const text = body.toLowerCase();
      if (!badWords.some(w => text.includes(w))) return;

      // 🛡️ Ignorer les administrateurs du groupe
      const metadata = await kaya.groupMetadata(from).catch(() => null);
      const participant = metadata?.participants.find(p => p.id === mek.sender);
      if (participant?.admin || participant?.isSuperAdmin) return;

      // 1. Suppression du message avec délai de sécurité
      await delay(500);
      await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

      const sender = mek.sender;

      if (config.action === 'kick') {
        await delay(1000);
        await kaya.groupParticipantsUpdate(from, [sender], 'remove');
      } 
      else if (config.action === 'warn') {
        const warnKey = `warn_badword_${sender}`;
        const currentWarns = getSetting(ownerId, warnKey, 0, groupId);
        const newWarns = currentWarns + 1;
        
        if (newWarns >= 3) {
          await delay(1000);
          await kaya.groupParticipantsUpdate(from, [sender], 'remove');
          await kaya.sendMessage(from, { 
            text: `🚫 @${sender.split("@")[0]} *${getString(ownerId, 'antiBadWordWarnKick')}*`, 
            mentions: [sender] 
          });
          setSetting(ownerId, warnKey, 0, groupId);
        } else {
          setSetting(ownerId, warnKey, newWarns, groupId);
          await kaya.sendMessage(from, { 
            text: `⚠️ *${getString(ownerId, 'antiBadWordAlertTitle')}*\n• *${getString(ownerId, 'antiBadWordUserLabel')} :* @${sender.split("@")[0]}\n• *${getString(ownerId, 'antiBadWordWarnLabel')} :* ${newWarns}/3`, 
            mentions: [sender] 
          });
        }
      } else {
        await kaya.sendMessage(from, { 
          text: `⚠️ @${sender.split('@')[0]} ${getString(ownerId, 'antiBadWordNotAllowed')}`, 
          mentions: [sender] 
        });
      }
    } catch (e) {
      console.error('❌ Badword detection error:', e);
    }
  }
};
