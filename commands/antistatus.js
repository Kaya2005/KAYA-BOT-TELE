import { getSetting, setSetting } from "../setting.js";
import { boxMessage, errorBox, successBox } from "../setting/theme.js";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: "antistatus",
  description: "Anti-group status system",
  category: "Group",
  group: true,
  admin: true,
  botAdmin: true,

  async execute(kaya, mek, from, args, prefix) {
    const action = args[0]?.toLowerCase();
    const groupId = from.split('@')[0];
    const ownerId = kaya.user.id.split(':')[0];

    if (!["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
      const menuContent = 
        `• \`${prefix}antistatus on\` *(ᴅᴇғᴀᴜʟᴛ: ᴡᴀʀɴ)*\n` +
        `• \`${prefix}antistatus delete\`\n` +
        `• \`${prefix}antistatus warn\`\n` +
        `• \`${prefix}antistatus kick\`\n` +
        `• \`${prefix}antistatus off\`\n` +
        `• \`${prefix}antistatus status\``;

      return await kaya.sendMessage(from, { 
        text: boxMessage('anti-status menu', menuContent, '📢') 
      }, { quoted: mek });
    }

    if (action === "status") {
      const isEnabled = getSetting(ownerId, "antistatus", false, groupId);
      const mode = getSetting(ownerId, "antiStatusMode", "warn", groupId);
      
      const statusContent = !isEnabled 
        ? `ᴀɴᴛɪ-sᴛᴀᴛᴜs ɪs ᴄᴜʀʀᴇɴᴛʟʏ ᴅɪsᴀʙʟᴇᴅ.` 
        : `• *sᴛᴀᴛᴜs :* ᴇɴᴀʙʟᴇᴅ\n• *ᴍᴏᴅᴇ :* ${mode.toUpperCase()}`;

      return await kaya.sendMessage(from, { 
        text: boxMessage('anti-status status', statusContent, '📊') 
      }, { quoted: mek });
    }

    if (action === "off") {
      setSetting(ownerId, "antistatus", false, groupId);
      return await kaya.sendMessage(from, { 
        text: boxMessage('anti-status', 'ᴀɴᴛɪ-sᴛᴀᴛᴜs ᴅɪsᴀʙʟᴇᴅ.', '❌') 
      }, { quoted: mek });
    }

    const mode = action === "on" ? "warn" : action;
    setSetting(ownerId, "antistatus", true, groupId);
    setSetting(ownerId, "antiStatusMode", mode, groupId);
    
    const successContent = `ᴀɴᴛɪ-sᴛᴀᴛᴜs ᴇɴᴀʙʟᴇᴅ ᴡɪᴛʜ ᴍᴏᴅᴇ :\n*${mode.toUpperCase()}*`;
    await kaya.sendMessage(from, { 
      text: successBox(successContent) 
    }, { quoted: mek });
  },

  async detect(kaya, mek, from, body) {
    try {
      const groupId = from.split('@')[0];
      const ownerId = kaya.user.id.split(':')[0];
      
      const isEnabled = getSetting(ownerId, "antistatus", false, groupId);
      if (!isEnabled || mek.key?.fromMe) return;

      const mode = getSetting(ownerId, "antiStatusMode", "warn", groupId);

      // Analyse de la structure du message pour identifier un statut de groupe
      const mtype = mek.mtype || '';
      const messageObj = mek.message || {};
      
      const isGroupStatus = 
        mtype === "groupStatusMessage" ||
        messageObj.groupStatusMessage ||
        (messageObj.protocolMessage && messageObj.protocolMessage.type === 0) ||
        (body && (body.includes("Statut de") || body.includes("Ajouté par") || body.includes("groupe a été mentionné")));

      if (!isGroupStatus) return;

      const metadata = await kaya.groupMetadata(from).catch(() => null);
      const participant = metadata?.participants.find(p => p.id === mek.sender);
      
      // Si l'expéditeur est admin ou super-admin, on laisse passer
      if (participant?.admin || participant?.isSuperAdmin) return;

      // 1. Suppression immédiate du statut
      await delay(300);
      await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

      // 2. Application des sanctions configurées
      if (mode === "kick") {
        await delay(800); 
        await kaya.groupParticipantsUpdate(from, [mek.sender], "remove");
      } 
      else if (mode === "warn") {
        const currentWarns = getSetting(ownerId, `status_warn_${mek.sender}`, 0, groupId);
        const newWarns = currentWarns + 1;
        setSetting(ownerId, `status_warn_${mek.sender}`, newWarns, groupId);

        if (newWarns >= 4) {
          await delay(800);
          await kaya.groupParticipantsUpdate(from, [mek.sender], "remove");
          await kaya.sendMessage(from, { text: `🚫 @${mek.sender.split("@")[0]} *ʀᴇᴀᴄʜᴇᴅ 𝟺/𝟺 sᴛᴀᴛᴜs ᴡᴀʀɴs ᴀɴᴅ wᴀs ᴋɪᴄᴋᴇᴅ.*`, mentions: [mek.sender] });
          setSetting(ownerId, `status_warn_${mek.sender}`, 0, groupId);
        } else {
          await kaya.sendMessage(from, { 
            text: `⚠️ *ᴀɴᴛɪ-sᴛᴀᴛᴜs ᴀʟᴇʀᴛ*\n• *ᴜsᴇʀ :* @${mek.sender.split("@")[0]}\n• *ᴡᴀʀɴ :* ${newWarns}/4`, 
            mentions: [mek.sender] 
          });
        }
      }
    } catch (err) {
      console.error("❌ AntiStatus detect error:", err);
    }
  }
};
