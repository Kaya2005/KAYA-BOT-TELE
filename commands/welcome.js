import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

const welcomeCache = new Set();

export default {
    name: 'welcome',
    alias: ['bienvenue', 'wel'],
    description: 'Enable/disable welcome messages',
    category: 'Group',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const status = await checkAdminOrOwner(kaya, from, mek.sender);
            if (!status.isBotOwner) return kaya.sendMessage(from, { text: '❌ Owner Only' });
            
            const action = args.join(' ').toLowerCase();
            const groupId = from.split('@')[0];

            if (!action) return kaya.sendMessage(from, { text: `⚙️ *WELCOME SETTINGS*\n\n${prefix}welcome on\n${prefix}welcome off\n${prefix}welcome status` });

            if (action === "on") { setSetting(groupId, 'welcomeEnabled', true); return kaya.sendMessage(from, { text: "✅ Welcome activé pour ce groupe." }); }
            if (action === "off") { setSetting(groupId, 'welcomeEnabled', false); return kaya.sendMessage(from, { text: "❌ Welcome désactivé pour ce groupe." }); }
            if (action === "status") {
                const isEnabled = getSetting(groupId, 'welcomeEnabled', false);
                return kaya.sendMessage(from, { text: `📊 *WELCOME STATUS*\n\nÉtat: ${isEnabled ? "ON" : "OFF"}` });
            }
        } catch (e) { console.error(e); }
    },

    async participantUpdate(kaya, update) {
        try {
            if (update.action !== "add") return;
            const from = update.id;
            const groupId = from.split('@')[0];
            const isEnabled = getSetting(groupId, 'welcomeEnabled', false);
            if (!isEnabled) return;

            const metadata = await kaya.groupMetadata(from).catch(() => ({}));
            const groupName = metadata.subject || "ce groupe";
            const memberCount = metadata.participants ? metadata.participants.length : 0;
            const creationDate = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString() : "Inconnue";

            for (let user of update.participants) {
                const userId = typeof user === 'string' ? user : user.id;
                if (welcomeCache.has(userId)) continue;
                welcomeCache.add(userId);
                setTimeout(() => welcomeCache.delete(userId), 30000);

                const msg = `▉ \`WELCOME\` ▉
▰▰▰▰▰▰▰▰▰▰
➠ User: @${userId.split("@")[0]}
➠ Group: ${groupName}
➠ Members: ${memberCount}
➠ Date: ${creationDate}
______________________`.trim();

                await kaya.sendMessage(from, { text: msg, mentions: [userId] });
            }
        } catch (e) { console.log("DÉTAIL ERREUR WELCOME :", e); }
    }
};
