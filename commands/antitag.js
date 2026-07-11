import { getSetting, setSetting } from "../setting.js";
import checkAdminOrOwner from "../setting/checkAdminOrOwner.js";

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
      
      if (!["on", "off", "delete", "kick", "status"].includes(action)) {
        return await kaya.sendMessage(from, { text: `🚫 *ANTITAG CONFIG*\n\n• \`${prefix}antitag on\` (delete)\n• \`${prefix}antitag kick\`\n• \`${prefix}antitag off\`\n• \`${prefix}antitag status\`` });
      }

      if (action === "status") {
        const isEnabled = getSetting(from, "antitag", false);
        const mode = getSetting(from, "antitagMode", "delete");
        return await kaya.sendMessage(from, { text: `📊 *ANTITAG STATUS*: ${isEnabled ? mode.toUpperCase() : "OFF"}` });
      }

      if (action === "off") {
        setSetting(from, "antitag", false); // Désactive pour case.js
        setSetting(from, "antitagMode", "off");
        return await kaya.sendMessage(from, { text: "❌ Anti-tag disabled." });
      }

      // Mode: delete ou kick
      const mode = action === "on" ? "delete" : action;
      setSetting(from, "antitag", true); // Active pour case.js
      setSetting(from, "antitagMode", mode);
      return await kaya.sendMessage(from, { text: `✅ Anti-tag set to: ${mode.toUpperCase()}` });

    } catch (err) {
      console.error("❌ ANTITAG ERROR:", err);
    }
  },

  async detect(kaya, mek, from, body) {
    try {
      // Le mode est géré par la logique du mode défini
      const mode = getSetting(from, "antitagMode", "delete");
      if (mek.key.fromMe) return;

      // Vérifier les mentions ou @all
      const isTagAll = /@all/i.test(body) || (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0);
      if (!isTagAll) return;

      // Ne pas agir sur les admins
      const status = await checkAdminOrOwner(kaya, from, mek.sender);
      if (status.isAdmin || status.isBotOwner) return;

      // 1. Supprimer le message
      await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

      // 2. Kicker si mode "kick"
      if (mode === "kick") {
        await kaya.groupParticipantsUpdate(from, [mek.sender], "remove");
        await kaya.sendMessage(from, { text: `🚫 @${mek.sender.split('@')[0]} removed for tagging.`, mentions: [mek.sender] });
      }
    } catch (err) {
      console.error("❌ ANTITAG DETECT ERROR:", err);
    }
  }
};
