import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

const goodbyeCache = new Set();

export default {
    name: 'goodbye',
    alias: ['partir', 'bye', 'leave'],
    description: 'Gestion des messages de départ',
    category: 'Group',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const status = await checkAdminOrOwner(kaya, from, mek.sender);
            if (!status.isBotOwner) return kaya.sendMessage(from, { text: '❌ Owner Only' });

            const action = args[0]?.toLowerCase();
            const groupId = from.split('@')[0];

            if (action === "on") {
                setSetting(groupId, 'goodbyeEnabled', true);
                return kaya.sendMessage(from, { text: "✅ Goodbye activé pour ce groupe." });
            } else if (action === "off") {
                setSetting(groupId, 'goodbyeEnabled', false);
                return kaya.sendMessage(from, { text: "❌ Goodbye désactivé pour ce groupe." });
            } else if (action === "all") {
                setSetting('global', 'goodbyeEnabled', true);
                return kaya.sendMessage(from, { text: "✅ Goodbye activé globalement." });
            }

            const isEnabled = getSetting(groupId, 'goodbyeEnabled', false);
            return kaya.sendMessage(from, { text: `📊 *GOODBYE STATUS*\n\nÉtat: ${isEnabled ? "ON" : "OFF"}` });
        } catch (e) { console.error(e); }
    },

    async participantUpdate(kaya, update) {
        try {
            if (update.action !== "remove") return;
            const from = update.id;
            const groupId = from.split('@')[0];
            
            const isEnabled = getSetting(groupId, 'goodbyeEnabled', false) || getSetting('global', 'goodbyeEnabled', false);
            if (!isEnabled) return;

            const metadata = await kaya.groupMetadata(from).catch(() => ({}));
            const groupName = metadata.subject || "ce groupe";

            for (let user of update.participants) {
                const userId = typeof user === 'string' ? user : user.id;
                if (goodbyeCache.has(userId)) continue;
                goodbyeCache.add(userId);
                setTimeout(() => goodbyeCache.delete(userId), 10000);

                let ppUrl;
                try {
                    ppUrl = await kaya.profilePictureUrl(userId, 'image');
                } catch {
                    ppUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
                }

                const msg = `▉ \`GOODBYE\` ▉
▰▰▰▰▰▰▰▰▰▰
➠ User: @${userId.split("@")[0]}
➠ Group: ${groupName}
➠ Statut: A quitté le groupe
➠ Date: ${new Date().toLocaleDateString()}
______________________`.trim();

                await kaya.sendMessage(from, {
                    image: { url: ppUrl },
                    caption: msg,
                    mentions: [userId],
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363410993553528@newsletter',
                            newsletterName: '𝐊𝐀𝐘𝐀 𝐁𝐎𝐓',
                            serverMessageId: 150
                        }
                    }
                });
            }
        } catch (e) { console.log("ERREUR GOODBYE :", e); }
    }
};
