import fs from 'fs';
import path from 'path';
import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

const goodbyeCache = new Set();

// Utility function to find the owner's ID via their phone number
function getTeleIdFromJid(jid) {
    const pairingFolder = './richstore/pairing';
    if (!fs.existsSync(pairingFolder)) return null;
    const files = fs.readdirSync(pairingFolder);
    for (const file of files) {
        if (file.startsWith('pairing_')) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(pairingFolder, file), 'utf-8'));
                if (data.number && data.number.includes(jid.split('@')[0])) {
                    return file.replace('pairing_', '').replace('.json', '');
                }
            } catch (e) {}
        }
    }
    return null;
}

export default {
    name: 'goodbye',
    alias: ['au-revoir', 'bye'],
    description: 'Manage goodbye messages',
    category: 'Group',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const status = await checkAdminOrOwner(kaya, from, mek.sender);
            if (!status.isBotOwner) return kaya.sendMessage(from, { text: '❌ Owner Only', contextInfo: getContextInfo() });
            
            const action = args[0]?.toLowerCase();
            const groupId = from.split('@')[0];
            const ownerId = getTeleIdFromJid(mek.sender) || "global";

            if (!action) return kaya.sendMessage(from, { text: `⚙️ *GOODBYE SETTINGS*\n\n${prefix}bye on (Current group)\n${prefix}bye off (Current group)\n${prefix}bye all (Global)\n${prefix}bye alloff (Disable global)\n${prefix}bye status`, contextInfo: getContextInfo() });

            if (action === "on") { 
                setSetting(groupId, 'goodbyeEnabled', true); 
                return kaya.sendMessage(from, { text: "✅ Goodbye enabled for this group.", contextInfo: getContextInfo() }); 
            }
            if (action === "off") { 
                setSetting(groupId, 'goodbyeEnabled', false); 
                return kaya.sendMessage(from, { text: "❌ Goodbye disabled for this group.", contextInfo: getContextInfo() }); 
            }
            if (action === "all") {
                setSetting(ownerId, 'goodbyeAll', true);
                return kaya.sendMessage(from, { text: `✅ Goodbye enabled globally for all your groups.`, contextInfo: getContextInfo() });
            }
            if (action === "alloff") {
                setSetting(ownerId, 'goodbyeAll', false);
                return kaya.sendMessage(from, { text: `❌ Goodbye disabled globally for all your groups.`, contextInfo: getContextInfo() });
            }
            if (action === "status") {
                const isEnabled = getSetting(groupId, 'goodbyeEnabled', false);
                const isAll = getSetting(ownerId, 'goodbyeAll', false);
                return kaya.sendMessage(from, { text: `📊 *GOODBYE STATUS*\n\nLocal: ${isEnabled ? "ON" : "OFF"}\nGlobal (All): ${isAll ? "ON" : "OFF"}`, contextInfo: getContextInfo() });
            }
        } catch (e) { console.error(e); }
    },

    async participantUpdate(kaya, update) {
        try {
            if (update.action !== "remove" && update.action !== "leave") return;
            const from = update.id;
            const groupId = from.split('@')[0];
            
            const ownerId = getTeleIdFromJid(from) || "global";
            
            const isEnabled = getSetting(groupId, 'goodbyeEnabled', false) || getSetting(ownerId, 'goodbyeAll', false);
            if (!isEnabled) return;

            const metadata = await kaya.groupMetadata(from).catch(() => ({}));
            const groupName = metadata.subject || "this group";
            const memberCount = metadata.participants ? metadata.participants.length : 0;
            const creationDate = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString() : "Unknown";

            for (let user of update.participants) {
                const userId = typeof user === 'string' ? user : user.id;
                if (goodbyeCache.has(userId)) continue;
                goodbyeCache.add(userId);
                setTimeout(() => goodbyeCache.delete(userId), 30000);

                // Get profile picture of the person who left
                let ppUrl;
                try {
                    ppUrl = await kaya.profilePictureUrl(userId, 'image');
                } catch {
                    ppUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'; // Default image
                }

                const msg = `▉ \`GOODBYE\` ▉
▰▰▰▰▰▰▰▰▰▰
➠ User: @${userId.split("@")[0]}
➠ Group: ${groupName}
➠ Members: ${memberCount}
➠ Date Created: ${creationDate}
______________________`.trim();

                await kaya.sendMessage(from, { 
                    image: { url: ppUrl },
                    caption: msg, 
                    mentions: [userId],
                    contextInfo: getContextInfo() 
                });
            }
        } catch (e) { console.log("GOODBYE PARTICIPANTUPDATE ERROR :", e); }
    }
};
