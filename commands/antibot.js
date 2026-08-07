//antibot.js
import { getSetting, setSetting } from "../setting.js";

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
      const ownerId = kaya.user.id.split(':')[0];
      
      if (!["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
          const menuText = `🛡️ *MENU DE PROTECTION ANTIBOT*\n\n` +
                           `Configurez la sécurité de votre groupe avec les commandes suivantes :\n\n` +
                           `📌 *${prefix}antibot on* (Active par défaut en mode warn)\n` +
                           `🗑️ *${prefix}antibot delete* (Supprime uniquement)\n` +
                           `⚠️ *${prefix}antibot warn* (Avertit puis exclut)\n` +
                           `🚫 *${prefix}antibot kick* (Exclut directement)\n` +
                           `📊 *${prefix}antibot status* (Vérifie l'état)\n` +
                           `❌ *${prefix}antibot off* (Désactive l'anti-bot)`;

          return await kaya.sendMessage(from, { text: menuText }, { quoted: mek });
      }

      if (action === "status") {
          const isEnabled = getSetting(ownerId, "antibot", false, groupId);
          const mode = getSetting(ownerId, "antibotMode", "warn", groupId);
          return await kaya.sendMessage(from, { 
              text: !isEnabled ? "❌ L'Anti-bot est désactivé sur ce groupe." : `✅ L'Anti-bot est activé\nMode actuel : *${mode.toUpperCase()}*` 
          }, { quoted: mek });
      }

      if (action === "off") {
        setSetting(ownerId, "antibot", false, groupId);
        return await kaya.sendMessage(from, { text: "❌ Anti-bot désactivé avec succès." }, { quoted: mek });
      }

      const mode = action === "on" ? "warn" : action;
      setSetting(ownerId, "antibot", true, groupId);
      setSetting(ownerId, "antibotMode", mode, groupId);
      
      await kaya.sendMessage(from, { text: `✅ Anti-bot activé avec succès !\nMode configuré : *${mode.toUpperCase()}*` }, { quoted: mek });
    } catch (err) {
      console.error("❌ Erreur dans la commande antibot:", err);
      await kaya.sendMessage(from, { text: "❌ Une erreur est survenue lors de l'exécution de la commande antibot." }, { quoted: mek }).catch(() => {});
    }
  },

  async detect(kaya, mek, from) {
    try {
      const groupId = from.split('@')[0];
      const ownerId = kaya.user.id.split(':')[0];
      
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
            text: `🚫 @${sender.split('@')[0]} a été expulsé pour activité suspecte de bot.`, 
            mentions: [sender] 
          });
        } else if (mode === "warn") {
          const currentWarns = getSetting(ownerId, `warn_bot_${sender}`, 0, groupId);
          const newWarns = currentWarns + 1;
          setSetting(ownerId, `warn_bot_${sender}`, newWarns, groupId);

          if (newWarns >= 4) {
            await delay(1200);
            await kaya.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
            await kaya.sendMessage(from, { text: `🚫 @${sender.split('@')[0]} a atteint 4/4 avertissements et a été expulsé.`, mentions: [sender] });
            setSetting(ownerId, `warn_bot_${sender}`, 0, groupId);
          } else {
            await kaya.sendMessage(from, { 
              text: `⚠️ AVERTISSEMENT ANTI-BOT\nUtilisateur : @${sender.split('@')[0]}\nAvertissement : ${newWarns}/4`, 
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
