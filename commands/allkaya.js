// ==================== commands/allkaya.js ====================
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';

export default {
  name: "allkaya",
  description: "📢 Send a message to all groups (Owner only)",
  category: "Owner",
  ownerOnly: true,
  usage: "allkaya <message> | <image_url (optional)>",

  async execute(kaya, mek, from, args, prefix) {
    try {
      const input = args.join(" ").trim();
      if (!input) {
        return await kaya.sendMessage(from, { 
          text: usageBox(prefix, 'allkaya', 'Message | ImageUrl (optional)') 
        }, { quoted: mek });
      }

      // Séparation texte et image
      const parts = input.split("|");
      const text = parts[0].trim();
      const imageUrl = parts[1] ? parts[1].trim() : null;

      // Récupération des groupes
      const groupsData = await kaya.groupFetchAllParticipating();
      const groups = Object.values(groupsData).filter(g => g.id.endsWith('@g.us'));

      if (!groups.length) {
        return await kaya.sendMessage(from, { 
          text: errorBox('ɴᴏ ɢʀᴏᴜᴘs ғᴏᴜɴᴅ.') 
        }, { quoted: mek });
      }

      await kaya.sendMessage(from, { 
        text: boxMessage('ʙʀᴏᴀᴅᴄᴀsᴛ', `sᴛᴀʀᴛᴇᴅ ᴛᴏ ${groups.length} ɢʀᴏᴜᴘs...`, '🚀') 
      }, { quoted: mek });

      let success = 0;
      let failed = 0;

      for (const group of groups) {
        try {
          const message = imageUrl
            ? { image: { url: imageUrl }, caption: text }
            : { text };

          await kaya.sendMessage(group.id, message);
          success++;

          // Anti-ban delay
          await new Promise(r => setTimeout(r, 1500)); 
        } catch (err) {
          failed++;
          console.error(`❌ Failed to send to ${group.id}:`, err?.message);
        }
      }

      const reportContent = 
        `ʙʀᴏᴀᴅᴄᴀsᴛ ᴄᴏᴍᴘʟᴇᴛᴇᴅ !\n\n` +
        `• *sᴜᴄᴄᴇss :* ${success}\n` +
        `• *ғᴀɪʟᴇᴅ :* ${failed}`;

      return await kaya.sendMessage(from, {
        text: successBox(reportContent)
      }, { quoted: mek });

    } catch (err) {
      console.error("❌ allkaya error:", err);
      return await kaya.sendMessage(from, { 
        text: errorBox('ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ ᴅᴜʀɪɴɢ ʙʀᴏᴀᴅᴄᴀsᴛ.') 
      }, { quoted: mek });
    }
  }
};
