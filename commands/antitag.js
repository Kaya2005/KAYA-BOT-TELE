// antitag.js
import { getSetting, setSetting } from "../setting.js";
import checkAdminOrOwner from "../setting/checkAdminOrOwner.js";
import { boxMessage, errorBox, successBox } from "../setting/theme.js";
import { getString } from "../setting/language.js";

// Fonction de délai pour éviter le comportement robotique
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: "antitag",
  description: "🚫 Anti tagall / mentions",
  category: "Group",
  group: true,
  admin: true,
  botAdmin: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const rawAction = args[0]?.toLowerCase();
      const groupId = from.split('@')[0];
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

      // 🔄 MAPPING DES COMMANDES SELON LA LANGUE (FR/EN)
      const actionMap = {
        // Activation
        "on": "on",
        "oui": "on",
        "yes": "on",

        // Désactivation
        "off": "off",
        "non": "off",
        "no": "off",

        // Modes & Actions
        "delete": "delete",
        "supprimer": "delete",

        "kick": "kick",
        "expulser": "kick",

        "status": "status",
        "statut": "status"
      };

      const action = actionMap[rawAction];
      
      if (!action) {
        const menuContent = 
          `• \`${prefix}antitag on / oui\` *(${getString(ownerId, 'antiTagDefaultDelete')})*\n` +
          `• \`${prefix}antitag delete / supprimer\` *(${getString(ownerId, 'cmd_delete_desc')})*\n` +
          `• \`${prefix}antitag kick / expulser\` *(${getString(ownerId, 'cmd_kick_desc')})*\n` +
          `• \`${prefix}antitag off / non\` *(${getString(ownerId, 'cmd_off_desc')})*\n` +
          `• \`${prefix}antitag status / statut\` *(${getString(ownerId, 'cmd_status_desc')})*`;

        return await kaya.sendMessage(from, { 
          text: boxMessage(getString(ownerId, 'antiTagMenuTitle'), menuContent, '🛡️') 
        }, { quoted: mek });
      }

      if (action === "status") {
        const isEnabled = getSetting(ownerId, "antitag", false, groupId);
        const mode = getSetting(ownerId, "antitagMode", "delete", groupId);
        
        const translatedMode = getString(ownerId, `mode_${mode}`);
        const statusValue = isEnabled ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off');

        const statusContent = !isEnabled 
          ? getString(ownerId, 'antiTagDisabledMsg') 
          : `• *${getString(ownerId, 'antiTagStatusLabel')} :* ${statusValue}\n• *${getString(ownerId, 'antiTagModeLabel')} :* ${translatedMode}`;

        return await kaya.sendMessage(from, { 
          text: boxMessage(getString(ownerId, 'antiTagStatusTitle'), statusContent, '📊') 
        }, { quoted: mek });
      }

      if (action === "off") {
        setSetting(ownerId, "antitag", false, groupId);
        setSetting(ownerId, "antitagMode", "off", groupId);
        return await kaya.sendMessage(from, { 
          text: boxMessage('anti-tag', getString(ownerId, 'antiTagOffMsg'), '❌') 
        }, { quoted: mek });
      }

      const mode = action === "on" ? "delete" : action;
      setSetting(ownerId, "antitag", true, groupId);
      setSetting(ownerId, "antitagMode", mode, groupId);
      
      const translatedMode = getString(ownerId, `mode_${mode}`);

      const successContent = `${getString(ownerId, 'antiTagEnabledWithMode')}\n• *${getString(ownerId, 'antiTagModeLabel')} :* ${translatedMode}`;
      return await kaya.sendMessage(from, { 
        text: successBox(successContent) 
      }, { quoted: mek });

    } catch (err) {
      console.error("❌ ANTITAG ERROR:", err);
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      await kaya.sendMessage(from, { 
        text: errorBox(getString(ownerId, 'antiTagError')) 
      }, { quoted: mek });
    }
  },

  async detect(kaya, mek, from, body) {
    try {
      const groupId = from.split('@')[0];
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

      const isEnabled = getSetting(ownerId, "antitag", false, groupId);
      if (!isEnabled || mek.key.fromMe) return;

      const mode = getSetting(ownerId, "antitagMode", "delete", groupId);

      const isTagAll = /@all/i.test(body) || (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0);
      if (!isTagAll) return;

      const status = await checkAdminOrOwner(kaya, from, mek.sender);
      if (status.isAdmin || status.isBotOwner) return;

      // 1. Suppression du message avec léger délai
      await delay(500); 
      await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

      // 2. Kicker si mode "kick" avec délai de sécurité
      if (mode === "kick") {
        await delay(1000); // Pause avant l'action destructive
        await kaya.groupParticipantsUpdate(from, [mek.sender], "remove").catch(() => {});
        await kaya.sendMessage(from, { 
          text: `🚫 @${mek.sender.split('@')[0]} *${getString(ownerId, 'antiTagKickedMsg')}*`, 
          mentions: [mek.sender] 
        });
      }
    } catch (err) {
      console.error("❌ ANTITAG DETECT ERROR:", err);
    }
  }
};
