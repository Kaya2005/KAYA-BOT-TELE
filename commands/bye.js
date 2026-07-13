import fs from 'fs';
import path from 'path';
import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

const goodbyeCache = new Set();

export default {
    name: 'goodbye',
    alias: ['au-revoir', 'bye'],
    description: 'Manage goodbye messages',
    category: 'Group',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const status = await checkAdminOrOwner(kaya, from, mek.sender);
            if (!status.isBotOwner) return kaya.sendMessage(from, { text: '❌ Owner Only', contextInfo: getContextInfo() }, { quoted: mek });
            
            const action = args[0]?.toLowerCase();
            const ownerId = kaya.user.id.split(':')[0];
            const groupId = from.split('@')[0];

            if (!action) return kaya.sendMessage(from, { text: `⚙️ *GOODBYE SETTINGS*\n\n${prefix}bye on (Current group)\n${prefix}bye off (Current group)\n${prefix}bye all (Global)\n${prefix}bye alloff (Disable global)\n${prefix}bye status`, contextInfo: getContextInfo() }, { quoted: mek });

            if (action === "on") { 
                setSetting(ownerId, 'goodbyeEnabled', true, groupId); 
                return kaya.sendMessage(from, { text: "✅ Goodbye enabled for this group.", contextInfo: getContextInfo() }, { quoted: mek }); 
            }
            if (action === "off") { 
                setSetting(ownerId, 'goodbyeEnabled', false, groupId); 
                return kaya.sendMessage(from, { text: "❌ Goodbye disabled for this group.", contextInfo: getContextInfo() }, { quoted: mek }); 
            }
            if (action === "all") {
                setSetting(ownerId, 'goodbyeAll', true);
                return kaya.sendMessage(from, { text: `✅ Goodbye enabled globally for all your groups.`, contextInfo: getContextInfo() }, { quoted: mek });
            }
            if (action === "alloff") {
                setSetting(ownerId, 'goodbyeAll', false);
                return kaya.sendMessage(from, { text: `❌ Goodbye disabled globally for all your groups.`, contextInfo: getContextInfo() }, { quoted: mek });
            }
            if (action === "status") {
                const isEnabled = getSetting(ownerId, 'goodbyeEnabled', false, groupId);
                const isAll = getSetting(ownerId, 'goodbyeAll', false);
                return kaya.sendMessage(from, { text: `📊 *GOODBYE STATUS*\n\nLocal: ${isEnabled ? "ON" : "OFF"}\nGlobal (All): ${isAll ? "ON" : "OFF"}`, contextInfo: getContextInfo() }, { quoted: mek });
            }
        } catch (e) { console.error('❌ goodbye.js error:', e); }
    },

    async participantUpdate(kaya, update) {
        try {
            if (update.action !== "remove" && update.action !== "leave") return;
            
            const from = update.id;
            const groupId = from.split('@')[0];
            const ownerId = kaya.user.id.split(':')[0];
            
            // Vérification via structure hiérarchique : ownerId + groupId
            const isEnabled = getSetting(ownerId, 'goodbyeEnabled', false, groupId) || getSetting(ownerId, 'goodbyeAll', false);
            if (!isEnabled) return;

            const metadata = await kaya.groupMetadata(from).catch(() => ({}));
            const groupName = metadata.subject || "this group";
            const memberCount = metadata.participants ? metadata.participants.length : 0;
            const creationDate = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString() : "Unknown";

            let ppUrl;
            try {
                ppUrl = await kaya.profilePictureUrl(from, 'image');
            } catch {
                ppUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
            }

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
➠ Date Created: ${creationDate}
______________________`.trim();

                await kaya.sendMessage(from, { 
                    image: { url: ppUrl },
                    caption: msg, 
                    mentions: [userId],
                    contextInfo: getContextInfo() 
                });
            }
        } catch (e) { /* silent */ }
    }
};
