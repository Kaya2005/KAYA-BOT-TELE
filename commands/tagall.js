import { sendWithBotImage, getBotName } from '../setting/botAssets.js';
import decodeJid from '../setting/decodeJid.js';

// Cache pour le cooldown (évite le spam de commande)
const cooldown = new Map();
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: "tagall",
  alias: ["mention", "everyone"],
  description: "📢 Mentionne tous les membres du groupe.",
  category: "Group",
  group: true,
  admin: true, // Seuls les admins peuvent taguer tout le monde

  execute: async (kaya, mek, from, args, prefix) => {
    try {
      const sender = mek.sender;
      
      // 1. Système de cooldown (30 secondes d'attente)
      const now = Date.now();
      if (cooldown.has(from) && now - cooldown.get(from) < 30000) {
        return await kaya.sendMessage(from, { text: "⏳ Veuillez patienter, le tagall est en cours de refroidissement." }, { quoted: mek });
      }
      cooldown.set(from, now);

      const botName = getBotName(sender);
      const metadata = await kaya.groupMetadata(from);
      const participants = metadata.participants;
      
      // 2. Préparation du message
      let mentionText = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰\n`;
      mentionText += `*📢 TAGALL - ${metadata.subject}*\n\n`;
      
      participants.forEach((p, i) => {
        // Utilisation de decodeJid pour nettoyer proprement l'identifiant du membre
        const userJid = decodeJid(p.id);
        const userNumber = userJid.split('@')[0];
        mentionText += `${i + 1}. @${userNumber}\n`;
      });

      mentionText += `\n▰▰▰▰▰▰▰▰▰▰\n*👥 Total membres:* ${participants.length}`;

      // 3. Délai de sécurité avant l'envoi
      await delay(1000); 

      await sendWithBotImage(
        kaya,
        from,
        sender,
        {
          caption: mentionText,
          mentions: participants.path ? participants.map(p => p.id) : participants.map(p => p.id)
        },
        { quoted: mek }
      );

    } catch (error) {
      console.error("❌ Erreur tagall :", error);
      await kaya.sendMessage(from, { text: "❌ Une erreur est survenue lors de la mention." }, { quoted: mek });
    }
  }
};
