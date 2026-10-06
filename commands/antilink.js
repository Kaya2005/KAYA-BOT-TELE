//antilink.js
import { getSetting, setSetting } from "../setting.js";

// Function to simulate a human-like delay (Anti-Ban)
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
    const ownerId = kaya.user.id.split(':')[0]; // Instance owner ID

    // If the admin just types "antilink" (no arguments), display the interactive menu
    if (!action) {
      const menuText = `╭─── 🔗 *ᴀɴᴛɪ-ʟɪɴᴋ ᴍᴇɴᴜ* 🔗 ───╮\n` +
        `│\n` +
        `│  *Direct Commands :*\n` +
        `│  • \`${prefix}antilink on\` *(Default: warn)*\n` +
        `│  • \`${prefix}antilink delete\`\n` +
        `│  • \`${prefix}antilink warn\`\n` +
        `│  • \`${prefix}antilink kick\`\n` +
        `│  • \`${prefix}antilink off\`\n` +
        `│  • \`${prefix}antilink status\`\n` +
        `│\n` +
        `╰────────────────────────╯\n\n` +
        `✨ *Or reply to this message with the corresponding number:* \n\n` +
        `1️⃣ ᴅᴇʟᴇᴛᴇ\n` +
        `2️⃣ ᴋɪᴄᴋ\n` +
        `3️⃣ ᴡᴀʀɴ\n` +
        `4️⃣ ᴏɴ *(Default)*\n` +
        `5️⃣ ᴏꜰꜰ\n` +
        `6️⃣ ꜱᴛᴀᴛᴜꜱ`;

      const sentMsg = await kaya.sendMessage(from, { text: menuText }, { quoted: mek });
      
      // Save the message ID so we know the user is replying to this specific menu
      if (sentMsg?.key?.id) {
        setSetting(ownerId, `antilink_menu_${groupId}`, sentMsg.key.id, groupId);
      }
      return;
    }

    // If the admin types directly "antilink on", "antilink delete", etc.
    if (!["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
      return await kaya.sendMessage(from, { 
        text: `❌ *Invalid Option.*\nUse \`${prefix}antilink\` to view the menu.` 
      }, { quoted: mek });
    }

    if (action === "status") {
      const isEnabled = getSetting(ownerId, "antilink", false, groupId);
      const mode = getSetting(ownerId, "antiLinkMode", "warn", groupId);
      return await kaya.sendMessage(from, { 
        text: !isEnabled ? "❌ *Anti-Link is disabled.*" : `✅ *Anti-Link is enabled.*\n📊 Mode : *${mode.toUpperCase()}*` 
      }, { quoted: mek });
    }

    if (action === "off") {
      setSetting(ownerId, "antilink", false, groupId);
      return await kaya.sendMessage(from, { text: "❌ *Anti-link system has been disabled.*" }, { quoted: mek });
    }

    // Enabling or changing mode directly
    const mode = action === "on" ? "warn" : action;
    setSetting(ownerId, "antilink", true, groupId);
    setSetting(ownerId, "antiLinkMode", mode, groupId);
    
    await kaya.sendMessage(from, { text: `✅ *Anti-link successfully enabled with mode:* *${mode.toUpperCase()}*` }, { quoted: mek });
  },

  async detect(kaya, mek, from, body) {
    try {
      const groupId = from.split('@')[0];
      const ownerId = kaya.user.id.split(':')[0];
      
      // --- INTERACTIVE MENU REPLY HANDLER ---
      const quotedMessage = mek.message?.extendedTextMessage?.contextInfo;
      if (quotedMessage && mek.sender) {
        const expectedMenuId = getSetting(ownerId, `antilink_menu_${groupId}`, null, groupId);
        
        // Check if the user is replying specifically to the bot's antilink menu
        if (expectedMenuId && quotedMessage.stanzaId === expectedMenuId) {
          const cleanedBody = body.trim();
          if (["1", "2", "3", "4", "5", "6"].includes(cleanedBody)) {
            // Verify if the user responding is an admin
            const metadata = await kaya.groupMetadata(from).catch(() => null);
            const participant = metadata?.participants.find(p => p.id === mek.sender);
            
            if (participant?.admin || participant?.isSuperAdmin) {
              let selectedAction = cleanedBody;
              if (selectedAction === "1") selectedAction = "delete";
              if (selectedAction === "2") selectedAction = "kick";
              if (selectedAction === "3") selectedAction = "warn";
              if (selectedAction === "4") selectedAction = "on";
              if (selectedAction === "5") selectedAction = "off";
              if (selectedAction === "6") selectedAction = "status";

              // Clear the menu ID so it cannot be reused indefinitely
              setSetting(ownerId, `antilink_menu_${groupId}`, null, groupId);

              if (selectedAction === "status") {
                const isEnabled = getSetting(ownerId, "antilink", false, groupId);
                const mode = getSetting(ownerId, "antiLinkMode", "warn", groupId);
                return await kaya.sendMessage(from, { 
                  text: !isEnabled ? "❌ *Anti-Link is disabled.*" : `✅ *Anti-Link is enabled.*\n📊 Mode : *${mode.toUpperCase()}*` 
                }, { quoted: mek });
              }

              if (selectedAction === "off") {
                setSetting(ownerId, "antilink", false, groupId);
                return await kaya.sendMessage(from, { text: "❌ *Anti-link system has been disabled.*" }, { quoted: mek });
              }

              const mode = selectedAction === "on" ? "warn" : selectedAction;
              setSetting(ownerId, "antilink", true, groupId);
              setSetting(ownerId, "antiLinkMode", mode, groupId);
              
              return await kaya.sendMessage(from, { text: `✅ *Anti-link successfully configured to:* *${mode.toUpperCase()}*` }, { quoted: mek });
            }
          }
        }
      }

      // --- STANDARD LINK DETECTION LOGIC ---
      const isEnabled = getSetting(ownerId, "antilink", false, groupId);
      if (!isEnabled || mek.key?.fromMe) return;

      const mode = getSetting(ownerId, "antiLinkMode", "warn", groupId);

      const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me)/i;
      if (!linkRegex.test(body)) return;

      const metadata = await kaya.groupMetadata(from).catch(() => null);
      const participant = metadata?.participants.find(p => p.id === mek.sender);
      if (participant?.admin || participant?.isSuperAdmin) return;

      // 1. Delete link (with a short human-like delay)
      await delay(500);
      await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

      // 2. Mode handling with safety delays
      if (mode === "kick") {
        await delay(1000); // Human-like pause before kicking
        await kaya.groupParticipantsUpdate(from, [mek.sender], "remove");
        await kaya.sendMessage(from, { text: `🚫 @${mek.sender.split("@")[0]} *was removed for sending a link.*`, mentions: [mek.sender] });
      } 
      else if (mode === "warn") {
        const currentWarns = getSetting(ownerId, `warn_${mek.sender}`, 0, groupId);
        const newWarns = currentWarns + 1;
        setSetting(ownerId, `warn_${mek.sender}`, newWarns, groupId);

        if (newWarns >= 4) {
          await delay(1000);
          await kaya.groupParticipantsUpdate(from, [mek.sender], "remove");
          await kaya.sendMessage(from, { text: `🚫 @${mek.sender.split("@")[0]} *reached 4/4 warnings and was removed.*`, mentions: [mek.sender] });
          setSetting(ownerId, `warn_${mek.sender}`, 0, groupId);
        } else {
          await kaya.sendMessage(from, { text: `⚠️ *ᴀɴᴛɪ-ʟɪɴᴋ ᴡᴀʀɴɪɴɢ*\n👤 User : @${mek.sender.split("@")[0]}\n📊 Warn : ${newWarns}/4`, mentions: [mek.sender] });
        }
      }
    } catch (err) {
      console.error("❌ AntiLink detect error:", err);
    }
  }
};
