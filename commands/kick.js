import checkAdminOrOwner from "../setting/checkAdminOrOwner.js";
import { getContextInfo } from "../setting/contextInfo.js";

export default {
  name: "kick",
  description: "Remove a member from the group",
  category: "Group",
  group: true,
  admin: true,
  botAdmin: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // 🔹 Validation des permissions (déjà gérée par case.js, mais sécurité renforcée)
      const status = await checkAdminOrOwner(kaya, from, mek.sender);
      if (!status.isAdmin) {
        return kaya.sendMessage(from, { text: "❌ This command is for admins only." }, { quoted: mek });
      }

      // 🔹 Cible du kick
      let target = null;

      // 1. Mention
      if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      // 2. Réponse à un message
      else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
        target = mek.message.extendedTextMessage.contextInfo.participant;
      }
      // 3. Numéro écrit
      else if (args[0]) {
        target = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      }

      if (!target) {
        return kaya.sendMessage(
          from, 
          { text: `⚙️ Usage: \`${prefix}kick @user\` or reply to their message.` }, 
          { quoted: mek }
        );
      }

      // 🔹 Protection : Vérifier si la cible est admin
      const metadata = await kaya.groupMetadata(from);
      const participants = metadata.participants || [];
      const botNumber = await kaya.decodeJid(kaya.user.id);
      
      const isTargetAdmin = participants.find(p => p.id === target)?.admin;
      
      if (isTargetAdmin) {
        return kaya.sendMessage(from, { text: "❌ Cannot kick an *Admin*." }, { quoted: mek });
      }

      // 🔹 Kick du membre
      await kaya.groupParticipantsUpdate(from, [target], "remove");
      
      // Confirmation visuelle (optionnelle)
      await kaya.sendMessage(from, { text: `✅ Successfully kicked @${target.split('@')[0]}`, mentions: [target] }, { quoted: mek });

    } catch (err) {
      console.error("❌ Kick command error:", err);
      return kaya.sendMessage(from, { text: "⚠️ Unable to remove this member." }, { quoted: mek });
    }
  }
};
