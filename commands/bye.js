// goodbye.js
import fs from 'fs';
import path from 'path';
import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';
import { usageBox, successBox, errorBox, boxMessage } from '../setting/theme.js';
import { getString } from '../setting/language.js';

const goodbyeCache = new Set();
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
    name: 'goodbye',
    alias: ['au-revoir', 'bye'],
    description: 'Manage goodbye messages',
    category: 'Group',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const status = await checkAdminOrOwner(kaya, from, mek.sender);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

            if (!status.isBotOwner) {
                return kaya.sendMessage(from, { 
                    text: errorBox(getString(ownerId, 'ownerOnly')), 
                    contextInfo: getContextInfo(mek.sender) 
                }, { quoted: mek });
            }
            
            const rawAction = args[0]?.toLowerCase();
            const groupId = from.split('@')[0];

            // 🔄 MAPPING DES COMMANDES SELON LA LANGUE (FR/EN)
            const actionMap = {
                "on": "on",
                "oui": "on",
                "yes": "on",

                "off": "off",
                "non": "off",
                "no": "off",

                "all": "all",
                "tout": "all",

                "alloff": "alloff",
                "toutoff": "alloff",

                "status": "status",
                "statut": "status"
            };

            const action = actionMap[rawAction];

            if (!action) {
                const usageContent = 
                    `• \`${prefix}bye on / oui\` *(${getString(ownerId, 'goodbyeUsageCurrent')})*\n` +
                    `• \`${prefix}bye off / non\` *(${getString(ownerId, 'goodbyeUsageCurrent')})*\n` +
                    `• \`${prefix}bye all / tout\` *(${getString(ownerId, 'goodbyeUsageGlobal')})*\n` +
                    `• \`${prefix}bye alloff\` *(${getString(ownerId, 'goodbyeUsageDisableGlobal')})*\n` +
                    `• \`${prefix}bye status / statut\``;

                return kaya.sendMessage(from, { 
                    text: boxMessage(getString(ownerId, 'goodbyeSettingsTitle'), usageContent, '⚙️'), 
                    contextInfo: getContextInfo(mek.sender) 
                }, { quoted: mek });
            }

            if (action === "on") { 
                setSetting(ownerId, 'goodbyeEnabled', true, groupId); 
                return kaya.sendMessage(from, { 
                    text: successBox(getString(ownerId, 'goodbyeGroupEnabled')), 
                    contextInfo: getContextInfo(mek.sender) 
                }, { quoted: mek }); 
            }
            if (action === "off") { 
                setSetting(ownerId, 'goodbyeEnabled', false, groupId); 
                return kaya.sendMessage(from, { 
                    text: errorBox(getString(ownerId, 'goodbyeGroupDisabled')), 
                    contextInfo: getContextInfo(mek.sender) 
                }, { quoted: mek }); 
            }
            if (action === "all") {
                setSetting(ownerId, 'goodbyeAll', true);
                return kaya.sendMessage(from, { 
                    text: successBox(getString(ownerId, 'goodbyeGlobalEnabled')), 
                    contextInfo: getContextInfo(mek.sender) 
                }, { quoted: mek });
            }
            if (action === "alloff") {
                setSetting(ownerId, 'goodbyeAll', false);
                return kaya.sendMessage(from, { 
                    text: errorBox(getString(ownerId, 'goodbyeGlobalDisabled')), 
                    contextInfo: getContextInfo(mek.sender) 
                }, { quoted: mek });
            }
            if (action === "status") {
                const isEnabled = getSetting(ownerId, 'goodbyeEnabled', false, groupId);
                const isAll = getSetting(ownerId, 'goodbyeAll', false);
                
                const statusContent = 
                    `• *${getString(ownerId, 'goodbyeLocalLabel')} :* ${isEnabled ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off')}\n` +
                    `• *${getString(ownerId, 'goodbyeGlobalLabel')} :* ${isAll ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off')}`;

                return kaya.sendMessage(from, { 
                    text: boxMessage(getString(ownerId, 'goodbyeStatusTitle'), statusContent, '📊'), 
                    contextInfo: getContextInfo(mek.sender) 
                }, { quoted: mek });
            }
        } catch (e) { 
            console.error('❌ goodbye.js error:', e); 
        }
    },

    async participantUpdate(kaya, update) {
        try {
            if (update.action !== "remove" && update.action !== "leave") return;
            
            const from = update.id;
            const groupId = from.split('@')[0];
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            
            const isEnabled = getSetting(ownerId, 'goodbyeEnabled', false, groupId) || getSetting(ownerId, 'goodbyeAll', false);
            if (!isEnabled) return;

            const metadata = await kaya.groupMetadata(from).catch(() => ({}));
            const groupName = metadata.subject || "this group";
            const memberCount = metadata.participants ? metadata.participants.length : 0;
            const creationDate = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString() : getString(ownerId, 'goodbyeUnknownDate');

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

                await delay(2000);

                const msg = `
▉ \`GOODBYE\` ▉
▰▰▰▰▰▰▰▰▰▰
➠ ${getString(ownerId, 'goodbyeUserLabel')}: @${userId.split("@")[0]}
➠ ${getString(ownerId, 'goodbyeGroupLabel')}: ${groupName}
➠ ${getString(ownerId, 'goodbyeMembersLabel')}: ${memberCount}
➠ ${getString(ownerId, 'goodbyeCreatedLabel')}: ${creationDate}
______________________`.trim();

                // Envoi normal sans reply
                await kaya.sendMessage(from, { 
                    image: { url: ppUrl },
                    caption: msg, 
                    mentions: [userId],
                    contextInfo: getContextInfo(ownerId + '@s.whatsapp.net') 
                });
            }
        } catch (e) { /* silent */ }
    }
};
