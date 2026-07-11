import { getSetting, setSetting } from "../setting.js";

export default {
  name: "antilink",
  description: "Anti-link system",
  category: "Group",
  group: true,
  admin: true,
  botAdmin: true,

  async execute(kaya, mek, from, args, prefix) {
    const action = args[0]?.toLowerCase();
    
    if (!["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
      return await kaya.sendMessage(from, { text: `🔗 *ANTI-LINK MENU*\n\n${prefix}antilink on (Default: warn)\n${prefix}antilink delete\n${prefix}antilink warn\n${prefix}antilink kick\n${prefix}antilink off\n${prefix}antilink status` }, { quoted: mek });
    }

    if (action === "status") {
      const isEnabled = getSetting(from, "antilink", false);
      const mode = getSetting(from, "antiLinkMode", "warn");
      return await kaya.sendMessage(from, { text: !isEnabled ? "❌ Anti-Link is Disabled" : `✅ Anti-Link is Enabled\nMode: *${mode.toUpperCase()}*` }, { quoted: mek });
    }

    if (action === "off") {
      setSetting(from, "antilink", false);
      return await kaya.sendMessage(from, { text: "❌ Anti-link disabled." }, { quoted: mek });
    }

    // Si on active ou change de mode
    const mode = action === "on" ? "warn" : action;
    setSetting(from, "antilink", true); // On active l'outil pour case.js
    setSetting(from, "antiLinkMode", mode); // On enregistre le mode
    
    await kaya.sendMessage(from, { text: `✅ Anti-link enabled with mode: *${mode.toUpperCase()}*` }, { quoted: mek });
  },

  async detect(kaya, mek, from, body) {
    try {
      // Pas besoin de vérifier 'disabled' ici car case.js le fait déjà
      const mode = getSetting(from, "antiLinkMode", "warn");
      if (mek.key?.fromMe) return;

      const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me)/i;
      if (!linkRegex.test(body)) return;

      const metadata = await kaya.groupMetadata(from).catch(() => null);
      const participant = metadata?.participants.find(p => p.id === mek.sender);
      if (participant?.admin || participant?.isSuperAdmin) return;

      // 1. Suppression du lien
      await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

      // 2. Gestion des modes
      if (mode === "kick") {
        await kaya.groupParticipantsUpdate(from, [mek.sender], "remove");
        await kaya.sendMessage(from, { text: `🚫 @${mek.sender.split("@")[0]} removed for sending a link.`, mentions: [mek.sender] });
      } 
      else if (mode === "warn") {
        const currentWarns = getSetting(from, `warn_${mek.sender}`, 0);
        const newWarns = currentWarns + 1;
        setSetting(from, `warn_${mek.sender}`, newWarns);

        if (newWarns >= 4) {
          await kaya.groupParticipantsUpdate(from, [mek.sender], "remove");
          await kaya.sendMessage(from, { text: `🚫 @${mek.sender.split("@")[0]} reached 4/4 warns and was kicked.`, mentions: [mek.sender] });
          setSetting(from, `warn_${mek.sender}`, 0); // Reset après kick
        } else {
          await kaya.sendMessage(from, { text: `⚠️ ANTI-LINK\nUser: @${mek.sender.split("@")[0]}\nWarn: ${newWarns}/4`, mentions: [mek.sender] });
        }
      }
    } catch (err) {
      console.error("❌ AntiLink detect error:", err);
    }
  }
};
