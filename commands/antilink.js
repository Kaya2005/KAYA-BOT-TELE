//antilink.js
import { getSetting, setSetting } from "../setting.js";

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
    const action = args[0]?.toLowerCase();
    const groupId = from.split('@')[0];
    const ownerId = kaya.user.id.split(':')[0]; // ID du propriétaire de l'instance

    if (!["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
      return await kaya.sendMessage(from, { 
        text: `🔗 *ANTI-LINK MENU*\n\n${prefix}antilink on (Default: warn)\n${prefix}antilink delete\n${prefix}antilink warn\n${prefix}antilink kick\n${prefix}antilink off\n${prefix}antilink status` 
      }, { quoted: mek });
    }

    if (action === "status") {
      const isEnabled = getSetting(ownerId, "antilink", false, groupId);
      const mode = getSetting(ownerId, "antiLinkMode", "warn", groupId);
      return await kaya.sendMessage(from, { 
        text: !isEnabled ? "❌ Anti-Link is Disabled" : `✅ Anti-Link is Enabled\nMode: *${mode.toUpperCase()}*` 
      }, { quoted: mek });
    }

    if (action === "off") {
      setSetting(ownerId, "antilink", false, groupId);
      return await kaya.sendMessage(from, { text: "❌ Anti-link disabled." }, { quoted: mek });
    }

    // Si on active ou change de mode
    const mode = action === "on" ? "warn" : action;
    setSetting(ownerId, "antilink", true, groupId);
    setSetting(ownerId, "antiLinkMode", mode, groupId);
    
    await kaya.sendMessage(from, { text: `✅ Anti-link enabled with mode: *${mode.toUpperCase()}*` }, { quoted: mek });
  },

  async detect(kaya, mek, from, body) {
    try {
      const groupId = from.split('@')[0];
      const ownerId = kaya.user.id.split(':')[0];
      
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
        await kaya.sendMessage(from, { text: `🚫 @${mek.sender.split("@")[0]} removed for sending a link.`, mentions: [mek.sender] });
      } 
      else if (mode === "warn") {
        // Sauvegarde des warns dans le dossier du groupe
        const currentWarns = getSetting(ownerId, `warn_${mek.sender}`, 0, groupId);
        const newWarns = currentWarns + 1;
        setSetting(ownerId, `warn_${mek.sender}`, newWarns, groupId);

        if (newWarns >= 4) {
          await delay(1000); // Pause avant le kick après 4 avertissements
          await kaya.groupParticipantsUpdate(from, [mek.sender], "remove");
          await kaya.sendMessage(from, { text: `🚫 @${mek.sender.split("@")[0]} reached 4/4 warns and was kicked.`, mentions: [mek.sender] });
          setSetting(ownerId, `warn_${mek.sender}`, 0, groupId); // Reset après kick
        } else {
          await kaya.sendMessage(from, { text: `⚠️ ANTI-LINK\nUser: @${mek.sender.split("@")[0]}\nWarn: ${newWarns}/4`, mentions: [mek.sender] });
        }
      }
    } catch (err) {
      console.error("❌ AntiLink detect error:", err);
    }
  }
};
