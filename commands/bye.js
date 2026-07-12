import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

const goodbyeCache = new Set();

export default {
    name: 'goodbye',
    alias: ['au-revoir', 'bye'],
    description: 'Enable/disable goodbye messages',
    category: 'Group',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const status = await checkAdminOrOwner(kaya, from, mek.sender);
            if (!status.isBotOwner) return kaya.sendMessage(from, { text: '❌ Owner Only' });
            
            const action = args.join(' ').toLowerCase();
            const groupId = from.split('@')[0];

            if (!action) return kaya.sendMessage(from, { text: `⚙️ *GOODBYE SETTINGS*\n\n${prefix}bye on\n${prefix}bye off\n${prefix}bye status` });

            if (action === "on") { setSetting(groupId, 'goodbyeEnabled', true); return kaya.sendMessage(from, { text: "✅ Goodbye activé pour ce groupe." }); }
            if (action === "off") { setSetting(groupId, 'goodbyeEnabled', false); return kaya.sendMessage(from, { text: "❌ Goodbye désactivé pour ce groupe." }); }
            if (action === "status") {
                const isEnabled = getSetting(groupId, 'goodbyeEnabled', false);
                return kaya.sendMessage(from, { text: `📊 *GOODBYE STATUS*\n\nÉtat: ${isEnabled ? "ON" : "OFF"}` });
            }
        } catch (e) { console.error(e); }
    },

    async participantUpdate(kaya, update) {
        try {
            if (update.action !== "remove" && update.action !== "leave") return;
            const from = update.id;
            const groupId = from.split('@')[0];
            const isEnabled = getSetting(groupId, 'goodbyeEnabled', false);
            if (!isEnabled) return;

            const metadata = await kaya.groupMetadata(from).catch(() => ({}));
            const groupName = metadata.subject || "ce groupe";
            const memberCount = metadata.participants ? metadata.participants.length : 0;
            const creationDate = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString() : "Inconnue";

            for (let user of update.participants) {
                const userId = typeof user === 'string' ? user : user.id;
                if (goodbyeCache.has(userId)) continue;
                goodbyeCache.add(userId);
                setTimeout(() => goodbyeCache.delete(userId), 30000);

                const msg = `▉ \`GOODBYE\` ▉
▰▰▰▰▰▰▰▰▰▰
➠ User: @${userId.split("@")[0]}
➠ Group: ${groupName}
➠ Members: ${memberCount}
➠ Date: ${creationDate}
______________________`.trim();

                await kaya.sendMessage(from, { text: msg, mentions: [userId] });
            }
        } catch (e) { console.log("DÉTAIL ERREUR GOODBYE :", e); }
    }
};
