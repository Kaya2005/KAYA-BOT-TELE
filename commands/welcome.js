import fs from 'fs';
import path from 'path';
import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';
import { randomDelay } from '../utils/kayaUtils.js';

const welcomeCache = new Set();

export default {
    name: 'welcome',
    alias: ['bienvenue', 'wel'],
    description: 'Manage welcome messages',
    category: 'Group',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const status = await checkAdminOrOwner(kaya, from, mek.sender);
            if (!status.isBotOwner) return kaya.sendMessage(from, { text: '❌ Owner Only', contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
            
            const action = args[0]?.toLowerCase();
            const ownerId = kaya.user.id.split(':')[0];
            const groupId = from.split('@')[0];

            if (!action) return kaya.sendMessage(from, { text: `⚙️ *WELCOME SETTINGS*\n\n${prefix}welcome on (Current group)\n${prefix}welcome off (Disable current & global)\n${prefix}welcome all (Global ON)\n${prefix}welcome alloff (Disable global)\n${prefix}welcome status`, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });

            if (action === "on") { 
                await setSetting(ownerId, 'welcomeEnabled', true, groupId); 
                return kaya.sendMessage(from, { text: "✅ Welcome enabled for this group.", contextInfo: getContextInfo(mek.sender) }, { quoted: mek }); 
            }
            if (action === "off") { 
                await setSetting(ownerId, 'welcomeEnabled', false, groupId); 
                await setSetting(ownerId, 'welcomeAll', 'off'); 
                return kaya.sendMessage(from, { text: "❌ Welcome disabled globally and for this group.", contextInfo: getContextInfo(mek.sender) }, { quoted: mek }); 
            }
            if (action === "all") {
                await setSetting(ownerId, 'welcomeAll', 'on');
                return kaya.sendMessage(from, { text: `✅ Welcome enabled globally for all your groups.`, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
            }
            if (action === "alloff") {
                await setSetting(ownerId, 'welcomeAll', 'off');
                return kaya.sendMessage(from, { text: `❌ Welcome disabled globally for all your groups.`, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
            }
            if (action === "status") {
                const isLocalEnabled = getSetting(ownerId, 'welcomeEnabled', false, groupId);
                const isAll = getSetting(ownerId, 'welcomeAll', 'on');

                return kaya.sendMessage(from, { text: `📊 *WELCOME STATUS*\n\nLocal: ${isLocalEnabled ? "ON" : "OFF"}\nGlobal (All): ${isAll.toUpperCase()}`, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
            }
        } catch (e) { console.error('❌ welcome.js error:', e); }
    },

    async participantUpdate(kaya, update) {
        try {
            if (update.action !== "add" && update.action !== "invite") return;
            
            const from = update.id;
            const groupId = from.split('@')[0];
            const ownerId = kaya.user.id.split(':')[0];
            
            const isAll = getSetting(ownerId, 'welcomeAll', 'on');
            let isEnabled = false;

            if (isAll === 'on') {
                isEnabled = true;
            } else {
                isEnabled = getSetting(ownerId, 'welcomeEnabled', false, groupId);
            }

            if (!isEnabled) return;

            // 🛡️ Human-like random delay before processing
            await randomDelay(5000, 12000);

            const metadata = await kaya.groupMetadata(from).catch(() => ({}));
            const groupName = metadata.subject || "this group";
            const memberCount = metadata.participants ? metadata.participants.length : 0;
            const creationDate = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString() : "Unknown";

            for (let user of update.participants) {
                const userId = typeof user === 'string' ? user : user.id;
                if (welcomeCache.has(userId)) continue;
                welcomeCache.add(userId);
                setTimeout(() => welcomeCache.delete(userId), 60000);

                const msg = `▉ \`WELCOME\` ▉
▰▰▰▰▰▰▰▰▰▰
➠ User: @${userId.split("@")[0]}
➠ Welcome to: ${groupName}
➠ Total Members: ${memberCount}
➠ Group Created: ${creationDate}
▰▰▰▰▰▰▰▰▰▰`.trim();

                await kaya.sendMessage(from, { 
                    text: msg, 
                    mentions: [userId],
                    contextInfo: getContextInfo(ownerId + '@s.whatsapp.net') 
                });

                // 🛡️ Anti-flood pause between multiple participants joining at once
                await randomDelay(4000, 9000);
            }
        } catch (e) { /* silent */ }
    }
};
