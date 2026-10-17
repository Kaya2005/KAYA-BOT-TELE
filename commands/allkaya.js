// ==================== commands/allkaya.js ====================
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';
import { getString } from '../setting/language.js'; // 🌐 Import de la gestion des langues

export default {
  name: "allkaya",
  description: "📢 Send a message to all groups (Owner only)",
  category: "Owner",
  ownerOnly: true,
  usage: "allkaya <message> | <image_url (optional)>",

  async execute(kaya, mek, from, args, prefix) {
    try {
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

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
          text: errorBox(getString(ownerId, 'allKayaNoGroups')) 
        }, { quoted: mek });
      }

      const startedMsg = getString(ownerId, 'allKayaStarted').replace('{count}', groups.length);
      await kaya.sendMessage(from, { 
        text: boxMessage(getString(ownerId, 'allKayaBroadcastTitle'), startedMsg, '🚀') 
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
        `${getString(ownerId, 'allKayaCompleted')}\n\n` +
        `• *${getString(ownerId, 'allKayaSuccess')} :* ${success}\n` +
        `• *${getString(ownerId, 'allKayaFailed')} :* ${failed}`;

      return await kaya.sendMessage(from, {
        text: successBox(reportContent)
      }, { quoted: mek });

    } catch (err) {
      console.error("❌ allkaya error:", err);
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      return await kaya.sendMessage(from, { 
        text: errorBox(getString(ownerId, 'allKayaError')) 
      }, { quoted: mek });
    }
  }
};
