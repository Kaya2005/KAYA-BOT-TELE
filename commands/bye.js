import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

// Cache pour éviter les messages de départ en triple
const goodbyeCache = new Set();

export default {
    name: 'goodbye',
    alias: ['au-revoir', 'bye'],
    description: 'Enable/disable goodbye messages',
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
                    text: `⚙️ *GOODBYE SETTINGS*\n\n${prefix}bye on\n${prefix}bye off\n${prefix}bye status`
                });
            }

            if (action === "on") {
                setSetting(groupId, 'goodbyeEnabled', true);
                return kaya.sendMessage(from, { text: "✅ Goodbye activé pour ce groupe." });
            }

            if (action === "off") {
                setSetting(groupId, 'goodbyeEnabled', false);
                return kaya.sendMessage(from, { text: "❌ Goodbye désactivé pour ce groupe." });
            }

            if (action === "status") {
                const isEnabled = getSetting(groupId, 'goodbyeEnabled', false);
                return kaya.sendMessage(from, {
                    text: `📊 *GOODBYE STATUS*\n\nÉtat: ${isEnabled ? "ON" : "OFF"}`
                });
            }
        } catch (e) {
            console.error("goodbye command error:", e);
        }
    },

    // --- Partie Événement ---
    async participantUpdate(kaya, update) {
        try {
            // Ici on vérifie l'action 'remove' ou 'leave' pour le départ
            if (update.action !== "remove" && update.action !== "leave") return;

            const from = update.id;
            const groupId = from.split('@')[0];
            const isEnabled = getSetting(groupId, 'goodbyeEnabled', false);

            if (!isEnabled) return;

            for (let user of update.participants) {
                const userId = typeof user === 'string' ? user : user.id;

                // Sécurité anti-doublon (ignore l'ID pendant 30 secondes)
                if (goodbyeCache.has(userId)) continue;
                goodbyeCache.add(userId);
                setTimeout(() => goodbyeCache.delete(userId), 30000);

                console.log(`[GOODBYE] Départ détecté : ${userId}`);

                const metadata = await kaya.groupMetadata(from).catch(() => ({ subject: "ce groupe" }));
                const userNumber = userId.split('@')[0];

                const msg = `👋 *GOODBYE*\n\n👤 User: @${userNumber}\n👥 Group: ${metadata.subject}\n\n😢 We are sorry to see you go!`;

                await kaya.sendMessage(from, {
                    text: msg,
                    mentions: [userId]
                }).catch(err => {
                    console.log("DÉTAIL ERREUR SENDMESSAGE GOODBYE :", err);
                });
            }
        } catch (e) {
            console.log("DÉTAIL ERREUR GOODBYE PARTICIPANTUPDATE :", e);
        }
    }
};
