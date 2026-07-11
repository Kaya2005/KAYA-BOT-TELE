import fs from 'fs';
import path from 'path';
import { sendWithBotImage, getBotName } from '../setting/botAssets.js';

export default {
  name: "tagall",
  alias: ["mention", "everyone"],
  description: "📢 Mentionne tous les membres du groupe.",
  category: "Group",
  group: true,
  admin: false, // Accès libre pour tous

  execute: async (kaya, mek, from, args, prefix) => {
    try {
      const sender = mek.sender;
      // Récupération dynamique du nom du bot pour cet utilisateur
      const botName = getBotName(sender);
      const metadata = await kaya.groupMetadata(from);
      const participants = metadata.participants;
      
      // Construction du message
      let mentionText = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰\n`;
      mentionText += `*📢 TAGALL - ${metadata.subject}*\n\n`;
      
      participants.forEach((p, i) => {
        mentionText += `${i + 1}. @${p.id.split('@')[0]}\n`;
      });

      mentionText += `\n▰▰▰▰▰▰▰▰▰▰\n*👥 Total membres:* ${participants.length}`;

      // Envoi avec votre système d'image intégré (sans contextInfo)
      await sendWithBotImage(
        kaya,
        from,
        sender, // Ajout du sender pour l'image personnalisée
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
