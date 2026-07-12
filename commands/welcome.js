import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

// Cache pour éviter les messages en triple
const welcomeCache = new Set();

export default {
    name: 'welcome',
    alias: ['bienvenue', 'wel'],
    description: 'Enable/disable welcome messages',
    category: 'Group',
    ownerOnly: true,

    // --- Partie Commande ---
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

    // --- Partie Événement ---
    async participantUpdate(kaya, update) {
        try {
            if (update.action !== "add") return;

            const from = update.id;
            const groupId = from.split('@')[0];
            const isEnabled = getSetting(groupId, 'welcomeEnabled', false);

            if (!isEnabled) return;

            for (let user of update.participants) {
                const userId = typeof user === 'string' ? user : user.id;

                // Sécurité anti-doublon (ignore l'ID pendant 30 secondes)
                if (welcomeCache.has(userId)) continue;
                welcomeCache.add(userId);
                setTimeout(() => welcomeCache.delete(userId), 30000);

                console.log(`[WELCOME] Nouvelle arrivée : ${userId}`);

                const metadata = await kaya.groupMetadata(from).catch(() => ({ subject: "ce groupe" }));
                const userNumber = userId.split('@')[0];

                const msg = `👋 *WELCOME*\n\n👤 User: @${userNumber}\n👥 Group: ${metadata.subject}\n\n✨ Welcome to the family!`;

                await kaya.sendMessage(from, {
                    text: msg,
                    mentions: [userId]
                }).catch(err => {
                    console.log("DÉTAIL ERREUR SENDMESSAGE WELCOME :", err);
                });
            }
        } catch (e) {
            console.log("DÉTAIL ERREUR WELCOME PARTICIPANTUPDATE :", e);
        }
    }
};
