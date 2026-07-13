import { getSetting, setSetting } from "../setting.js";
import checkAdminOrOwner from "../setting/checkAdminOrOwner.js";

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
      const action = args[0]?.toLowerCase();
      const groupId = from.split('@')[0];
      const ownerId = kaya.user.id.split(':')[0];
      
      if (!["on", "off", "delete", "kick", "status"].includes(action)) {
        return await kaya.sendMessage(from, { text: `🚫 *ANTITAG CONFIG*\n\n• \`${prefix}antitag on\` (delete)\n• \`${prefix}antitag kick\`\n• \`${prefix}antitag off\`\n• \`${prefix}antitag status\`` });
      }

      if (action === "status") {
        const isEnabled = getSetting(ownerId, "antitag", false, groupId);
        const mode = getSetting(ownerId, "antitagMode", "delete", groupId);
        return await kaya.sendMessage(from, { text: `📊 *ANTITAG STATUS*: ${isEnabled ? mode.toUpperCase() : "OFF"}` });
      }

      if (action === "off") {
        setSetting(ownerId, "antitag", false, groupId);
        setSetting(ownerId, "antitagMode", "off", groupId);
        return await kaya.sendMessage(from, { text: "❌ Anti-tag disabled." });
      }

      const mode = action === "on" ? "delete" : action;
      setSetting(ownerId, "antitag", true, groupId);
      setSetting(ownerId, "antitagMode", mode, groupId);
      return await kaya.sendMessage(from, { text: `✅ Anti-tag set to: ${mode.toUpperCase()}` });

    } catch (err) {
      console.error("❌ ANTITAG ERROR:", err);
    }
  },

  async detect(kaya, mek, from, body) {
    try {
      const groupId = from.split('@')[0];
      const ownerId = kaya.user.id.split(':')[0];

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
        await kaya.sendMessage(from, { text: `🚫 @${mek.sender.split('@')[0]} removed for tagging.`, mentions: [mek.sender] });
      }
    } catch (err) {
      console.error("❌ ANTITAG DETECT ERROR:", err);
    }
  }
};
