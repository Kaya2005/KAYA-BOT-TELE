//antibot.js
import { getSetting, setSetting } from "../setting.js";

// Fonction de délai pour éviter le comportement robotique
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: "antibot",
  description: "Protects group against automated spam bots.",
  category: "Group",
  admin: true,
  botAdmin: true,
  group: true,

  async execute(kaya, mek, from, args, prefix) {
    const action = args[0]?.toLowerCase();
    const groupId = from.split('@')[0];
    const ownerId = kaya.user.id.split(':')[0];
    
    // Si l'utilisateur clique sur un bouton interactif, l'argument peut passer par selectedButtonId
    const selectedAction = action || mek.msg?.nativeFlowResponseMessage?.paramsJson ? JSON.parse(mek.msg.nativeFlowResponseMessage.paramsJson).id : null;

    const currentAction = selectedAction || action;

    if (!["on", "off", "delete", "warn", "kick", "status"].includes(currentAction)) {
        // Envoi du message avec des boutons interactifs Baileys 7.x
        const buttonMessage = {
            viewOnce: true,
            interactiveMessage: {
                header: { title: "🛡️ PROTECTION ANTIBOT", subtitle: "Gestion de la sécurité", hasMediaAttachment: false },
                body: { text: `Sélectionnez une option ci-dessous pour configurer l'anti-bot de votre groupe :` },
                footer: { text: global.botName || "KAYA-MD" },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({ display_text: "✅ Activer (Warn)", id: `${prefix}antibot on` })
                        },
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({ display_text: "🚫 Mode Kick", id: `${prefix}antibot kick` })
                        },
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({ display_text: "🗑️ Mode Delete", id: `${prefix}antibot delete` })
                        },
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({ display_text: "📊 Statut", id: `${prefix}antibot status` })
                        },
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({ display_text: "❌ Désactiver", id: `${prefix}antibot off` })
                        }
                    ]
                }
            }
        };

        return await kaya.sendMessage(from, buttonMessage, { quoted: mek });
    }

    if (currentAction === "status") {
        const isEnabled = getSetting(ownerId, "antibot", false, groupId);
        const mode = getSetting(ownerId, "antibotMode", "warn", groupId);
        return await kaya.sendMessage(from, { text: !isEnabled ? "❌ Anti-bot is Disabled" : `✅ Anti-bot is Enabled\nMode: *${mode.toUpperCase()}*` }, { quoted: mek });
    }

    if (currentAction === "off") {
      setSetting(ownerId, "antibot", false, groupId);
      return await kaya.sendMessage(from, { text: "❌ Anti-bot disabled." }, { quoted: mek });
    }

    const mode = currentAction === "on" ? "warn" : currentAction;
    setSetting(ownerId, "antibot", true, groupId);
    setSetting(ownerId, "antibotMode", mode, groupId);
    
    await kaya.sendMessage(from, { text: `✅ Anti-bot enabled with mode: *${mode.toUpperCase()}*` }, { quoted: mek });
  },

  async detect(kaya, mek, from) {
    try {
      const groupId = from.split('@')[0];
      const ownerId = kaya.user.id.split(':')[0];
      
      const isEnabled = getSetting(ownerId, "antibot", false, groupId);
      const mode = getSetting(ownerId, "antibotMode", "warn", groupId);
      
      const sender = mek.sender;
      
      if (mek.key.fromMe || !sender || !isEnabled) return;

      const isBotId = /^3EB0|^4EB0|^5EB0|^6EB0|^7EB0/.test(mek.key.id || "");
      const isProtocol = mek.message?.protocolMessage || mek.message?.reactionMessage;

      if (isBotId || isProtocol) {
        // 1. Suppression systématique avec un court délai
        await delay(500);
        await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

        const metadata = await kaya.groupMetadata(from).catch(() => null);
        const participant = metadata?.participants.find(p => p.id === sender);
        if (participant?.admin || participant?.isSuperAdmin) return;

        // 2. Gestion des modes avec délais de sécurité
        if (mode === "kick") {
          await delay(1200); // Délai avant le kick
          await kaya.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
          await kaya.sendMessage(from, { 
            text: `🚫 @${sender.split('@')[0]} removed for bot-like activity.`, 
            mentions: [sender] 
          });
        } else if (mode === "warn") {
          const currentWarns = getSetting(ownerId, `warn_bot_${sender}`, 0, groupId);
          const newWarns = currentWarns + 1;
          setSetting(ownerId, `warn_bot_${sender}`, newWarns, groupId);

          if (newWarns >= 4) {
            await delay(1200); // Délai avant le kick final
            await kaya.groupParticipantsUpdate(from, [sender], "remove");
            await kaya.sendMessage(from, { text: `🚫 @${sender.split('@')[0]} reached 4/4 warns and was kicked for bot activity.`, mentions: [sender] });
            setSetting(ownerId, `warn_bot_${sender}`, 0, groupId);
          } else {
            await kaya.sendMessage(from, { 
              text: `⚠️ ANTI-BOT WARNING\nUser: @${sender.split('@')[0]}\nWarn: ${newWarns}/4`, 
              mentions: [sender] 
            });
          }
        }
      }
    } catch (err) {
      console.error("❌ AntiBot detect error:", err);
    }
  }
};
