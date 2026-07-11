import { getSetting, setSetting } from "../setting.js";
import checkAdminOrOwner from "../setting/checkAdminOrOwner.js";

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
    const action = args[0]?.toLowerCase(); // on, off, status
    const mode = args[1]?.toLowerCase(); // delete, warn, kick

    if (!action || !["on", "off", "status"].includes(action)) {
      return await kaya.sendMessage(from, { 
        text: `🛡️ *ANTISPAM SETTINGS*\n\nUsage:\n• \`${prefix}antispam on [delete|warn|kick]\`\n• \`${prefix}antispam off\`\n• \`${prefix}antispam status\`` 
      }, { quoted: mek });
    }

    if (action === "status") {
      const config = getSetting(from, "antispam", { enabled: false, mode: "delete" });
      return await kaya.sendMessage(from, { 
        text: `📊 *Anti-Spam Status*\nStatus: ${config.enabled ? "✅" : "❌"}\nMode: *${config.mode}*` 
      }, { quoted: mek });
    }

    if (action === "off") {
      setSetting(from, "antispam", { enabled: false, mode: "delete" });
      return await kaya.sendMessage(from, { text: "✅ Anti-spam disabled." }, { quoted: mek });
    }

    // Si "on", on vérifie le mode
    const selectedMode = ["delete", "warn", "kick"].includes(mode) ? mode : "delete";
    setSetting(from, "antispam", { enabled: true, mode: selectedMode });
    
    await kaya.sendMessage(from, { text: `✅ Anti-spam enabled!\nMode: *${selectedMode}*` }, { quoted: mek });
  },

  async detect(kaya, mek, from) {
    try {
      if (mek.key.fromMe) return;
      const config = getSetting(from, "antispam", { enabled: false, mode: "delete" });
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
        
        // Action toujours effectuée : Supprimer le message
        await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

        // Actions conditionnelles
        if (config.mode === "warn") {
          await kaya.sendMessage(from, { 
            text: `⚠️ @${sender.split("@")[0]} Stop spamming!`, 
            mentions: [sender] 
          }).catch(() => {});
        } 
        else if (config.mode === "kick") {
          await kaya.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
          await kaya.sendMessage(from, { 
            text: `🚫 @${sender.split("@")[0]} removed for spamming.`, 
            mentions: [sender] 
          }).catch(() => {});
        }

        // Reset compteur
        global.spamTracker[from][sender] = [];
      }
    } catch (err) {
      console.error("❌ Antispam detect error:", err);
    }
  }
};
