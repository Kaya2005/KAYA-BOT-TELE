// antispam.js
import { getSetting, setSetting } from "../setting.js";
import checkAdminOrOwner from "../setting/checkAdminOrOwner.js";
import { boxMessage, errorBox, successBox } from "../setting/theme.js";
import { getString } from "../setting/language.js";

// Fonction de délai pour éviter le spam par le bot
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Configuration
const MESSAGE_LIMIT = 8;      
const TIME_WINDOW = 5000;

export default {
  name: "antispam",
  description: "Protects group against flood/spam (delete/warn/kick)",
  category: "Group",
  group: true,
  admin: true,
  botAdmin: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const rawAction = args[0]?.toLowerCase();
      const rawMode = args[1]?.toLowerCase();
      const groupId = from.split('@')[0];
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

      // 🔄 MAPPING DES COMMANDES SELON LA LANGUE (FR/EN)
      const actionMap = {
        "on": "on",
        "oui": "on",
        "yes": "on",

        "off": "off",
        "non": "off",
        "no": "off",

        "status": "status",
        "statut": "status"
      };

      const modeMap = {
        "delete": "delete",
        "supprimer": "delete",

        "warn": "warn",
        "avertir": "warn",

        "kick": "kick",
        "expulser": "kick"
      };

      const action = actionMap[rawAction];
      const mode = modeMap[rawMode];

      if (!action) {
        const menuContent = 
          `• \`${prefix}antispam on / oui [delete|warn|kick]\`\n` +
          `• \`${prefix}antispam off / non\`\n` +
          `• \`${prefix}antispam status / statut\``;

        return await kaya.sendMessage(from, { 
          text: boxMessage(getString(ownerId, 'antiSpamMenuTitle'), menuContent, '⚡') 
        }, { quoted: mek });
      }

      if (action === "status") {
        const config = getSetting(ownerId, "antispam", { enabled: false, mode: "delete" }, groupId);
        
        const translatedMode = getString(ownerId, `mode_${config.mode}`);
        const statusValue = config.enabled ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off');

        const statusContent = !config.enabled 
          ? getString(ownerId, 'antiSpamDisabledMsg') 
          : `• *${getString(ownerId, 'antiSpamStatusLabel')} :* ${statusValue}\n• *${getString(ownerId, 'antiSpamModeLabel')} :* ${translatedMode}`;

        return await kaya.sendMessage(from, { 
          text: boxMessage(getString(ownerId, 'antiSpamStatusTitle'), statusContent, '📊') 
        }, { quoted: mek });
      }

      if (action === "off") {
        setSetting(ownerId, "antispam", { enabled: false, mode: "delete" }, groupId);
        return await kaya.sendMessage(from, { 
          text: boxMessage('anti-spam', getString(ownerId, 'antiSpamOffMsg'), '❌') 
        }, { quoted: mek });
      }

      const selectedMode = mode || "delete";
      setSetting(ownerId, "antispam", { enabled: true, mode: selectedMode }, groupId);
      
      const translatedMode = getString(ownerId, `mode_${selectedMode}`);

      const successContent = `${getString(ownerId, 'antiSpamEnabledWithMode')}\n• *${getString(ownerId, 'antiSpamModeLabel')} :* ${translatedMode}`;
      await kaya.sendMessage(from, { 
        text: successBox(successContent) 
      }, { quoted: mek });

    } catch (err) {
      console.error("❌ Erreur dans la commande antispam:", err);
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      await kaya.sendMessage(from, { text: errorBox(getString(ownerId, 'antiSpamError')) }, { quoted: mek }).catch(() => {});
    }
  },

  async detect(kaya, mek, from) {
    try {
      if (mek.key.fromMe) return;
      const groupId = from.split('@')[0];
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      
      const config = getSetting(ownerId, "antispam", { enabled: false, mode: "delete" }, groupId);
      if (!config.enabled) return;

      const sender = mek.sender;
      const status = await checkAdminOrOwner(kaya, from, sender);
      if (status.isAdmin || status.isBotOwner) return;

      global.spamTracker ??= {};
      global.spamTracker[from] ??= {};
      global.spamTracker[from][sender] ??= [];

      const now = Date.now();
      global.spamTracker[from][sender].push(now);
      global.spamTracker[from][sender] = global.spamTracker[from][sender].filter(t => now - t <= TIME_WINDOW);

      if (global.spamTracker[from][sender].length >= MESSAGE_LIMIT) {
        
        // Suppression du message déclencheur avec un délai
        await delay(300);
        await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

        if (config.mode === "warn") {
          await delay(500); // Pause avant l'avertissement
          await kaya.sendMessage(from, { 
            text: `⚠️ @${sender.split("@")[0]} *${getString(ownerId, 'antiSpamStopSpamming')}*`, 
            mentions: [sender] 
          }).catch(() => {});
        } 
        else if (config.mode === "kick") {
          await delay(1000); // Pause humaine avant le kick
          await kaya.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
          await kaya.sendMessage(from, { 
            text: `🚫 @${sender.split("@")[0]} *${getString(ownerId, 'antiSpamKickedMsg')}*`, 
            mentions: [sender] 
          }).catch(() => {});
        }

        global.spamTracker[from][sender] = [];
      }
    } catch (err) {
      console.error("❌ Antispam detect error:", err);
    }
  }
};
