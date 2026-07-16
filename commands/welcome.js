//welcome.js
import fs from 'fs';
import path from 'path';
import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

const welcomeCache = new Set();
// Fonction de délai pour éviter le spam
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
    name: 'welcome',
    alias: ['bienvenue', 'wel'],
    description: 'Manage welcome messages',
    category: 'Group',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const status = await checkAdminOrOwner(kaya, from, mek.sender);
            if (!status.isBotOwner) return kaya.sendMessage(from, { text: '❌ Owner Only', contextInfo: getContextInfo() }, { quoted: mek });
            
            const action = args[0]?.toLowerCase();
            const ownerId = kaya.user.id.split(':')[0];
            const groupId = from.split('@')[0];

            if (!action) return kaya.sendMessage(from, { text: `⚙️ *WELCOME SETTINGS*\n\n${prefix}welcome on (Current group)\n${prefix}welcome off (Current group)\n${prefix}welcome all (Global)\n${prefix}welcome alloff (Disable global)\n${prefix}welcome status`, contextInfo: getContextInfo() }, { quoted: mek });

            if (action === "on") { 
                setSetting(ownerId, 'welcomeEnabled', true, groupId); 
                return kaya.sendMessage(from, { text: "✅ Welcome enabled for this group.", contextInfo: getContextInfo() }, { quoted: mek }); 
            }
            if (action === "off") { 
                setSetting(ownerId, 'welcomeEnabled', false, groupId); 
                return kaya.sendMessage(from, { text: "❌ Welcome disabled for this group.", contextInfo: getContextInfo() }, { quoted: mek }); 
            }
            if (action === "all") {
                setSetting(ownerId, 'welcomeAll', true);
                return kaya.sendMessage(from, { text: `✅ Welcome enabled globally for all your groups.`, contextInfo: getContextInfo() }, { quoted: mek });
            }
            if (action === "alloff") {
                setSetting(ownerId, 'welcomeAll', false);
                return kaya.sendMessage(from, { text: `❌ Welcome disabled globally for all your groups.`, contextInfo: getContextInfo() }, { quoted: mek });
            }
            if (action === "status") {
                const isEnabled = getSetting(ownerId, 'welcomeEnabled', false, groupId);
                const isAll = getSetting(ownerId, 'welcomeAll', false);
                return kaya.sendMessage(from, { text: `📊 *WELCOME STATUS*\n\nLocal: ${isEnabled ? "ON" : "OFF"}\nGlobal (All): ${isAll ? "ON" : "OFF"}`, contextInfo: getContextInfo() }, { quoted: mek });
            }
        } catch (e) { console.error('❌ welcome.js error:', e); }
    },

    async participantUpdate(kaya, update) {
        try {
            if (update.action !== "add" && update.action !== "invite") return;
            
            const from = update.id;
            const groupId = from.split('@')[0];
            const ownerId = kaya.user.id.split(':')[0];
            
            const isEnabled = getSetting(ownerId, 'welcomeEnabled', false, groupId) || getSetting(ownerId, 'welcomeAll', false);
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
                if (welcomeCache.has(userId)) continue;
                welcomeCache.add(userId);
                setTimeout(() => welcomeCache.delete(userId), 30000);

                // AJOUT DU DÉLAI DE SÉCURITÉ ICI
                await delay(2000);

                const msg = `▉ \`WELCOME\` ▉
▰▰▰▰▰▰▰▰▰▰
➠ User: @${userId.split("@")[0]}
➠ Welcome to: ${groupName}
➠ Total Members: ${memberCount}
➠ Group Created: ${creationDate}
______________________
𝐁𝐎𝐓➠https://t.me/kayav1_bot
▰▰▰▰▰▰▰▰▰▰`.trim();

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
