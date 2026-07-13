import { sendWithBotImage, getBotName } from '../setting/botAssets.js';

// Cache pour le cooldown (évite le spam de commande)
const cooldown = new Map();
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: "tagall",
  alias: ["mention", "everyone"],
  description: "📢 Mentionne tous les membres du groupe.",
  category: "Group",
  group: true,
  admin: true, // PASSÉ EN TRUE : Seuls les admins doivent pouvoir taguer tout le monde

  execute: async (kaya, mek, from, args, prefix) => {
    try {
      const sender = mek.sender;
      
      // 1. Système de cooldown (30 secondes d'attente entre chaque tagall)
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
        mentionText += `${i + 1}. @${p.id.split('@')[0]}\n`;
      });

      mentionText += `\n▰▰▰▰▰▰▰▰▰▰\n*👥 Total membres:* ${participants.length}`;

      // 3. Délai de sécurité avant d'envoyer la notification de masse
      await delay(1000); 

      await sendWithBotImage(
        kaya,
        from,
        sender,
        {
          caption: mentionText,
          mentions: participants.map(p => p.id)
        },
        { quoted: mek }
      );

    } catch (error) {
      console.error("❌ Erreur tagall :", error);
      await kaya.sendMessage(from, { text: "❌ Une erreur est survenue lors de la mention." }, { quoted: mek });
    }
  }
};
