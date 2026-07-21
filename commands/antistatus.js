import { getSetting, setSetting } from "../setting.js";

// Fonction pour simuler un délai humain (Anti-Ban)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: "antistatus",
  aliases: ["antistatustag"],
  description: "Anti-status mention system to remove status notifications in groups",
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
        text: `📢 *ANTI-STATUS MENU*\n\n${prefix}antistatus on (Default: delete)\n${prefix}antistatus delete\n${prefix}antistatus warn\n${prefix}antistatus kick\n${prefix}antistatus off\n${prefix}antistatus status` 
      }, { quoted: mek });
    }

    if (action === "status") {
      const isEnabled = getSetting(ownerId, "antistatus", false, groupId);
      const mode = getSetting(ownerId, "antiStatusMode", "delete", groupId);
      return await kaya.sendMessage(from, { 
        text: !isEnabled ? "❌ Anti-Status is Disabled" : `✅ Anti-Status is Enabled\nMode: *${mode.toUpperCase()}*` 
      }, { quoted: mek });
    }

    if (action === "off") {
      setSetting(ownerId, "antistatus", false, groupId);
      return await kaya.sendMessage(from, { text: "❌ Anti-status disabled." }, { quoted: mek });
    }

    // Par défaut, l'activation (on) met le mode "delete" pour nettoyer le groupe sans forcément bannir
    const mode = action === "on" ? "delete" : action;
    setSetting(ownerId, "antistatus", true, groupId);
    setSetting(ownerId, "antiStatusMode", mode, groupId);
    
    await kaya.sendMessage(from, { text: `✅ Anti-status enabled with mode: *${mode.toUpperCase()}*` }, { quoted: mek });
  },

  async detect(kaya, mek, from, body) {
    try {
      const groupId = from.split('@')[0];
      const ownerId = kaya.user.id.split(':')[0];
      
      const isEnabled = getSetting(ownerId, "antistatus", false, groupId);
      if (!isEnabled) return;

      const mode = getSetting(ownerId, "antiStatusMode", "delete", groupId);

      // Expression régulière pour détecter les notifications de mention de statut (Français & Anglais)
      const statusMentionRegex = /(a été mentionné|has been mentioned|statut de|status of)/i;
      
      if (!statusMentionRegex.test(body)) return;

      // 1. Suppression immédiate du message de statut indésirable
      await delay(500);
      await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

      // 2. Gestion des sanctions (uniquement si un expéditeur valide est détecté)
      if (mek.sender && mek.sender !== kaya.user.id && mode !== "delete") {
        const metadata = await kaya.groupMetadata(from).catch(() => null);
        const participant = metadata?.participants.find(p => p.id === mek.sender);
        if (participant?.admin || participant?.isSuperAdmin) return; // Exempter les admins

        if (mode === "kick") {
          await delay(1000);
          await kaya.groupParticipantsUpdate(from, [mek.sender], "remove");
          await kaya.sendMessage(from, { text: `🚫 @${mek.sender.split("@")[0]} removed for mentioning the group in a status.`, mentions: [mek.sender] });
        } 
        else if (mode === "warn") {
          const warnKey = `warn_status_${mek.sender}`;
          const currentWarns = getSetting(ownerId, warnKey, 0, groupId);
          const newWarns = currentWarns + 1;
          setSetting(ownerId, warnKey, newWarns, groupId);

          if (newWarns >= 4) {
            await delay(1000);
            await kaya.groupParticipantsUpdate(from, [mek.sender], "remove");
            await kaya.sendMessage(from, { text: `🚫 @${mek.sender.split("@")[0]} reached 4/4 warns for status mentions and was kicked.`, mentions: [mek.sender] });
            setSetting(ownerId, warnKey, 0, groupId);
          } else {
            await kaya.sendMessage(from, { text: `⚠️ ANTI-STATUS\nUser: @${mek.sender.split("@")[0]}\nWarn: ${newWarns}/4`, mentions: [mek.sender] });
          }
        }
      }
    } catch (err) {
      console.error("❌ AntiStatus detect error:", err);
    }
  }
};
