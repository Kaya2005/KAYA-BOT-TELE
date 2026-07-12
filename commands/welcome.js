import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

export default {
    name: 'welcome',
    alias: ['bienvenue', 'wel'],
    description: 'Enable/disable welcome messages',
    category: 'Group',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const status = await checkAdminOrOwner(kaya, from, mek.sender);

            if (!status.isBotOwner) {
                return kaya.sendMessage(from, { text: '❌ Owner Only' });
            }

            const action = args.join(' ').toLowerCase();
            const groupId = from.split('@')[0];

            if (!action) {
                return kaya.sendMessage(from, {
                    text: `⚙️ *WELCOME SETTINGS*\n\n${prefix}welcome on\n${prefix}welcome off\n${prefix}welcome status`
                });
            }

            if (action === "on") {
                setSetting(groupId, 'welcomeEnabled', true);
                return kaya.sendMessage(from, { text: "✅ Welcome activé pour ce groupe." });
            }

            if (action === "off") {
                setSetting(groupId, 'welcomeEnabled', false);
                return kaya.sendMessage(from, { text: "❌ Welcome désactivé pour ce groupe." });
            }

            if (action === "status") {
                const isEnabled = getSetting(groupId, 'welcomeEnabled', false);
                return kaya.sendMessage(from, {
                    text: `📊 *WELCOME STATUS*\n\nÉtat: ${isEnabled ? "ON" : "OFF"}`
                });
            }

        } catch (e) {
            console.error("welcome command error:", e);
        }
    },

    async detect(kaya, update, from) {
        try {
            console.log("========== WELCOME DETECT ==========");
            console.log("FROM :", from);
            console.log("UPDATE :", update);

            if (update.action !== "add") {
                console.log("Action ignorée :", update.action);
                return;
            }

            const groupId = from.split('@')[0];
            console.log("GROUP ID :", groupId);

            const isEnabled = getSetting(groupId, 'welcomeEnabled', false);
            console.log("WELCOME ENABLED :", isEnabled);

            if (!isEnabled) {
                console.log("Le welcome est désactivé.");
                return;
            }

            const metadata = await kaya.groupMetadata(from).catch(err => {
                console.error("Erreur groupMetadata :", err);
                return { subject: "ce groupe" };
            });

            console.log("Participants :", update.participants);

            for (const user of update.participants) {
                const msg = `👋 *WELCOME*\n\n👤 User: @${user.split("@")[0]}\n👥 Group: ${metadata.subject}\n\n✨ Welcome to the family!`;

                console.log("Envoi du message à :", user);

                await kaya.sendMessage(from, {
                    text: msg,
                    mentions: [user],
                    contextInfo: {
                        ...getContextInfo(),
                        mentionedJid: [user]
                    }
                });

                console.log("Message envoyé.");
            }

        } catch (e) {
            console.error("Welcome detect error:", e);
        }
    }
};