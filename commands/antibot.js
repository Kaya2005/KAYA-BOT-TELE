import { getSetting, setSetting } from "../setting.js";

export default {
  name: "antibot",
  description: "Protects group against automated spam bots.",
  category: "Group",
  admin: true,
  botAdmin: true,
  group: true,

  async execute(kaya, mek, from, args, prefix) {
    const action = args[0]?.toLowerCase();
    
    if (!["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
        return await kaya.sendMessage(from, { 
            text: `🛡️ *ANTIBOT MENU*\n\n${prefix}antibot on (Default: warn)\n${prefix}antibot delete\n${prefix}antibot warn\n${prefix}antibot kick\n${prefix}antibot off\n${prefix}antibot status` 
        }, { quoted: mek });
    }

    if (action === "status") {
        const isEnabled = getSetting(from, "antibot", false);
        const mode = getSetting(from, "antibotMode", "warn");
        return await kaya.sendMessage(from, { text: !isEnabled ? "❌ Anti-bot is Disabled" : `✅ Anti-bot is Enabled\nMode: *${mode.toUpperCase()}*` }, { quoted: mek });
    }

    if (action === "off") {
      setSetting(from, "antibot", false);
      return await kaya.sendMessage(from, { text: "❌ Anti-bot disabled." }, { quoted: mek });
    }

    // Si on active ou change de mode
    const mode = action === "on" ? "warn" : action;
    setSetting(from, "antibot", true);
    setSetting(from, "antibotMode", mode);
    
    await kaya.sendMessage(from, { text: `✅ Anti-bot enabled with mode: *${mode.toUpperCase()}*` }, { quoted: mek });
  },

  async detect(kaya, mek, from) {
    try {
      const mode = getSetting(from, "antibotMode", "warn");
      const sender = mek.sender;
      
      // Sécurité : Ignorer si vient du bot ou si pas d'expéditeur
      if (mek.key.fromMe || !sender) return;

      const isBotId = /^3EB0|^4EB0|^5EB0|^6EB0|^7EB0/.test(mek.key.id || "");
      const isProtocol = mek.message?.protocolMessage || mek.message?.reactionMessage;

      if (isBotId || isProtocol) {
        // 1. Suppression systématique
        await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

        // Ne pas agir sur les admins
        const metadata = await kaya.groupMetadata(from).catch(() => null);
        const participant = metadata?.participants.find(p => p.id === sender);
        if (participant?.admin || participant?.isSuperAdmin) return;

        // 2. Gestion des modes
        if (mode === "kick") {
          await kaya.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
          await kaya.sendMessage(from, { 
            text: `🚫 @${sender.split('@')[0]} removed for bot-like activity.`, 
            mentions: [sender] 
          });
        } else if (mode === "warn") {
          const currentWarns = getSetting(from, `warn_bot_${sender}`, 0);
          const newWarns = currentWarns + 1;
          setSetting(from, `warn_bot_${sender}`, newWarns);

          if (newWarns >= 4) {
            await kaya.groupParticipantsUpdate(from, [sender], "remove");
            await kaya.sendMessage(from, { text: `🚫 @${sender.split('@')[0]} reached 4/4 warns and was kicked for bot activity.`, mentions: [sender] });
            setSetting(from, `warn_bot_${sender}`, 0);
          } else {
            await kaya.sendMessage(from, { 
              text: `⚠️ ANTI-BOT WARNING\nUser: @${sender.split('@')[0]}\nWarn: ${newWarns}/4`, 
              mentions: [sender] 
            });
          }
        }
      }
    } catch (err) {
      console.error("❌ AntiBot detect error:", err);
    }
  }
};
