// antibot.js
import { getSetting, setSetting } from "../setting.js";
import { boxMessage, errorBox, successBox } from "../setting/theme.js";
import { getString } from "../setting/language.js";

// Fonction de délai pour éviter le comportement robotique
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: "antibot",
  description: "Protects group against automated spam bots.",
  category: "Group",
  admin: true,
  botAdmin: true,
  group: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const action = args[0]?.toLowerCase();
      const groupId = from.split('@')[0];
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      
      if (!["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
          const menuContent = 
              `• \`${prefix}antibot on\` *(${getString(ownerId, 'antiBotDefaultWarn')})*\n` +
              `• \`${prefix}antibot delete\` *(${getString(ownerId, 'cmd_delete_desc')})*\n` +
              `• \`${prefix}antibot warn\` *(${getString(ownerId, 'cmd_warn_desc')})*\n` +
              `• \`${prefix}antibot kick\` *(${getString(ownerId, 'cmd_kick_desc')})*\n` +
              `• \`${prefix}antibot off\` *(${getString(ownerId, 'cmd_off_desc')})*\n` +
              `• \`${prefix}antibot status\` *(${getString(ownerId, 'cmd_status_desc')})*`;

          const menuText = boxMessage(getString(ownerId, 'antiBotMenuTitle'), menuContent, '🛡️');
          return await kaya.sendMessage(from, { text: menuText }, { quoted: mek });
      }

      if (action === "status") {
          const isEnabled = getSetting(ownerId, "antibot", false, groupId);
          const mode = getSetting(ownerId, "antibotMode", "warn", groupId);
          
          const translatedMode = getString(ownerId, `mode_${mode}`);
          const statusValue = isEnabled ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off');

          const statusContent = !isEnabled 
              ? getString(ownerId, 'antiBotDisabledMsg') 
              : `• *${getString(ownerId, 'antiBotStatusLabel')} :* ${statusValue}\n• *${getString(ownerId, 'antiBotModeLabel')} :* ${translatedMode}`;

          const statusText = boxMessage(getString(ownerId, 'antiBotStatusTitle'), statusContent, '📊');
          return await kaya.sendMessage(from, { text: statusText }, { quoted: mek });
      }

      if (action === "off") {
        setSetting(ownerId, "antibot", false, groupId);
        return await kaya.sendMessage(from, { text: boxMessage('anti-bot', getString(ownerId, 'antiBotOffMsg'), '❌') }, { quoted: mek });
      }

      const mode = action === "on" ? "warn" : action;
      setSetting(ownerId, "antibot", true, groupId);
      setSetting(ownerId, "antibotMode", mode, groupId);
      
      const translatedMode = getString(ownerId, `mode_${mode}`);

      const successContent = `${getString(ownerId, 'antiBotEnabledWithMode')}\n*${translatedMode}*`;
      await kaya.sendMessage(from, { text: successBox(successContent) }, { quoted: mek });
      
    } catch (err) {
      console.error("❌ Erreur dans la commande antibot:", err);
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      await kaya.sendMessage(from, { text: errorBox(getString(ownerId, 'antiBotError')) }, { quoted: mek }).catch(() => {});
    }
  },

  async detect(kaya, mek, from) {
    try {
      const groupId = from.split('@')[0];
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      
      const isEnabled = getSetting(ownerId, "antibot", false, groupId);
      const mode = getSetting(ownerId, "antibotMode", "warn", groupId);
      
      const sender = mek.sender;
      
      if (mek.key.fromMe || !sender || !isEnabled) return;

      const isBotId = /^3EB0|^4EB0|^5EB0|^6EB0|^7EB0/.test(mek.key.id || "");
      const isProtocol = mek.message?.protocolMessage || mek.message?.reactionMessage;

      if (isBotId || isProtocol) {
        // 1. Suppression systématique avec un court délai
        await delay(500);
        await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

        const metadata = await kaya.groupMetadata(from).catch(() => null);
        const participant = metadata?.participants.find(p => p.id === sender);
        if (participant?.admin || participant?.isSuperAdmin) return;

        // 2. Gestion des modes avec délais de sécurité
        if (mode === "kick") {
          await delay(1200);
          await kaya.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
          await kaya.sendMessage(from, { 
            text: `🚫 @${sender.split('@')[0]} *${getString(ownerId, 'antiBotKickedMsg')}*`, 
            mentions: [sender] 
          });
        } else if (mode === "warn") {
          const currentWarns = getSetting(ownerId, `warn_bot_${sender}`, 0, groupId);
          const newWarns = currentWarns + 1;
          setSetting(ownerId, `warn_bot_${sender}`, newWarns, groupId);

          if (newWarns >= 4) {
            await delay(1200);
            await kaya.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
            await kaya.sendMessage(from, { 
              text: `🚫 @${sender.split('@')[0]} *${getString(ownerId, 'antiBotWarnKickMsg')}*`, 
              mentions: [sender] 
            });
            setSetting(ownerId, `warn_bot_${sender}`, 0, groupId);
          } else {
            await kaya.sendMessage(from, { 
              text: `⚠️ *${getString(ownerId, 'antiBotAlertTitle')}*\n• *${getString(ownerId, 'antiBotUserLabel')} :* @${sender.split('@')[0]}\n• *${getString(ownerId, 'antiBotWarnLabel')} :* ${newWarns}/4`, 
              mentions: [sender] 
            });
          }
        }
      }
    } catch (err) {
      console.error("❌ Erreur dans la détection AntiBot:", err);
    }
  }
};
