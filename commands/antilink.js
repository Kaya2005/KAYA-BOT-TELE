// antilink.js
import { getSetting, setSetting } from "../setting.js";
import { boxMessage, errorBox, successBox } from "../setting/theme.js";
import { getString } from "../setting/language.js";

// Fonction pour simuler un délai humain (Anti-Ban)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: "antilink",
  description: "Anti-link system",
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

        "warn": "warn",
        "avertir": "warn",

        "kick": "kick",
        "expulser": "kick",

        "status": "status",
        "statut": "status"
      };

      const action = actionMap[rawAction];

      if (!action) {
        const menuContent = 
          `• \`${prefix}antilink on / oui\` *(${getString(ownerId, 'antiLinkDefaultWarn')})*\n` +
          `• \`${prefix}antilink delete / supprimer\` *(${getString(ownerId, 'cmd_delete_desc')})*\n` +
          `• \`${prefix}antilink warn / avertir\` *(${getString(ownerId, 'cmd_warn_desc')})*\n` +
          `• \`${prefix}antilink kick / expulser\` *(${getString(ownerId, 'cmd_kick_desc')})*\n` +
          `• \`${prefix}antilink off / non\` *(${getString(ownerId, 'cmd_off_desc')})*\n` +
          `• \`${prefix}antilink status / statut\` *(${getString(ownerId, 'cmd_status_desc')})*`;

        return await kaya.sendMessage(from, { 
          text: boxMessage(getString(ownerId, 'antiLinkMenuTitle'), menuContent, '🔗') 
        }, { quoted: mek });
      }

      if (action === "status") {
        const isEnabled = getSetting(ownerId, "antilink", false, groupId);
        const mode = getSetting(ownerId, "antiLinkMode", "warn", groupId);
        
        const translatedMode = getString(ownerId, `mode_${mode}`);
        const statusValue = isEnabled ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off');

        const statusContent = !isEnabled 
          ? getString(ownerId, 'antiLinkDisabledMsg') 
          : `• *${getString(ownerId, 'antiLinkStatusLabel')} :* ${statusValue}\n• *${getString(ownerId, 'antiLinkModeLabel')} :* ${translatedMode}`;

        return await kaya.sendMessage(from, { 
          text: boxMessage(getString(ownerId, 'antiLinkStatusTitle'), statusContent, '📊') 
        }, { quoted: mek });
      }

      if (action === "off") {
        setSetting(ownerId, "antilink", false, groupId);
        return await kaya.sendMessage(from, { 
          text: boxMessage('anti-link', getString(ownerId, 'antiLinkOffMsg'), '❌') 
        }, { quoted: mek });
      }

      // Si on active ou change de mode
      const mode = action === "on" ? "warn" : action;
      setSetting(ownerId, "antilink", true, groupId);
      setSetting(ownerId, "antiLinkMode", mode, groupId);
      
      const translatedMode = getString(ownerId, `mode_${mode}`);

      const successContent = `${getString(ownerId, 'antiLinkEnabledWithMode')}\n*${translatedMode}*`;
      await kaya.sendMessage(from, { 
        text: successBox(successContent) 
      }, { quoted: mek });

    } catch (err) {
      console.error("❌ Erreur dans la commande antilink:", err);
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      await kaya.sendMessage(from, { text: errorBox(getString(ownerId, 'antiLinkError')) }, { quoted: mek }).catch(() => {});
    }
  },

  async detect(kaya, mek, from, body) {
    try {
      const groupId = from.split('@')[0];
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      
      const isEnabled = getSetting(ownerId, "antilink", false, groupId);
      if (!isEnabled || mek.key?.fromMe) return;

      const mode = getSetting(ownerId, "antiLinkMode", "warn", groupId);

      const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me)/i;
      if (!linkRegex.test(body)) return;

      const metadata = await kaya.groupMetadata(from).catch(() => null);
      const participant = metadata?.participants.find(p => p.id === mek.sender);
      if (participant?.admin || participant?.isSuperAdmin) return;

      // 1. Suppression du lien (Avec délai pour ne pas paraître robotique)
      await delay(500);
      await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

      // 2. Gestion des modes avec délais de sécurité
      if (mode === "kick") {
        await delay(1000); // Pause humaine avant de kicker
        await kaya.groupParticipantsUpdate(from, [mek.sender], "remove");
      } 
      else if (mode === "warn") {
        const currentWarns = getSetting(ownerId, `warn_${mek.sender}`, 0, groupId);
        const newWarns = currentWarns + 1;
        setSetting(ownerId, `warn_${mek.sender}`, newWarns, groupId);

        if (newWarns >= 4) {
          await delay(1000);
          await kaya.groupParticipantsUpdate(from, [mek.sender], "remove");
          await kaya.sendMessage(from, { 
            text: `🚫 @${mek.sender.split("@")[0]} *${getString(ownerId, 'antiLinkWarnKickMsg')}*`, 
            mentions: [mek.sender] 
          });
          setSetting(ownerId, `warn_${mek.sender}`, 0, groupId);
        } else {
          await kaya.sendMessage(from, { 
            text: `⚠️ *${getString(ownerId, 'antiLinkAlertTitle')}*\n• *${getString(ownerId, 'antiLinkUserLabel')} :* @${mek.sender.split("@")[0]}\n• *${getString(ownerId, 'antiLinkWarnLabel')} :* ${newWarns}/4`, 
            mentions: [mek.sender] 
          });
        }
      }
    } catch (err) {
      console.error("❌ AntiLink detect error:", err);
    }
  }
};
