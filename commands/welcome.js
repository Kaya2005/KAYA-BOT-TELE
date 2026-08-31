import fs from 'fs';
import path from 'path';
import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

const welcomeCache = new Set();
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- SYSTÈME ANTI-BAN / RATE LIMIT ---
let welcomeCount = 0;
let pauseUntil = 0;
const MAX_WELCOMES = 10;             // Limite de messages avant pause
const PAUSE_DURATION = 10 * 60 * 1000; // Pause de 10 minutes (en millisecondes)

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
                let isAll = getSetting(ownerId, 'welcomeAll', null);
                if (!isAll) isAll = 'off'; // Par défaut 'off' si non défini

                return kaya.sendMessage(from, { text: `📊 *WELCOME STATUS*\n\nLocal: ${isLocalEnabled ? "ON" : "OFF"}\nGlobal (All): ${isAll.toUpperCase()}`, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
            }
        } catch (e) { console.error('❌ welcome.js error:', e); }
    },

    async participantUpdate(kaya, update) {
        try {
            if (update.action !== "add" && update.action !== "invite") return;
            
            // Vérification de la pause anti-ban
            if (Date.now() < pauseUntil) return;

            const from = update.id;
            const groupId = from.split('@')[0];
            const ownerId = kaya.user.id.split(':')[0];
            
            // Récupère le réglage global
            let isAll = getSetting(ownerId, 'welcomeAll', null);
            
            // Si le réglage global n'a jamais été initialisé, on le met explicitement à 'off'
            if (isAll === null || isAll === undefined) {
                isAll = 'off';
                await setSetting(ownerId, 'welcomeAll', 'off');
            }

            let isEnabled = false;

            if (isAll === 'on') {
                isEnabled = true;
            } else {
                isEnabled = getSetting(ownerId, 'welcomeEnabled', false, groupId);
            }

            if (!isEnabled) return;

            const metadata = await kaya.groupMetadata(from).catch(() => ({}));
            const groupName = metadata.subject || "this group";
            const memberCount = metadata.participants ? metadata.participants.length : 0;
            const creationDate = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString() : "Unknown";
            const now = new Date().toLocaleDateString();

            const logoPath = path.join(process.cwd(), 'setting', 'logo.png');
            const logoBuffer = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;

            for (let user of update.participants) {
                // Re-vérifie si la pause s'est déclenchée en cours de boucle
                if (Date.now() < pauseUntil) break;

                const userId = typeof user === 'string' ? user : user.id;
                if (welcomeCache.has(userId)) continue;
                welcomeCache.add(userId);
                setTimeout(() => welcomeCache.delete(userId), 30000);

                const randomDelay = Math.floor(Math.random() * 1000) + 4000;
                await delay(randomDelay);

                const username = `@${userId.split("@")[0]}`;
                const groupSize = memberCount;

                const msg = `▰▰▰▰▰▰▰▰▰▰
├ 👤 Welcome ${username}
├ 🎓 Group: *${groupName}*
├ 👥 Members: ${groupSize}
├ 🏗️ Created on: ${creationDate}
├ 📆 Date: ${now}
├ 📜 \`Rules\` :
│  ┗ No forbidden links ❌
│  ┗ No adult content 🔞
│  ┗ No spamming 🚫
╰────────────────⬣
   https://t.me/kayatech2
  ▰▰▰▰▰▰▰▰▰▰`.trim();

                const sendPayload = {
                    caption: msg,
                    mentions: [userId],
                    contextInfo: getContextInfo(ownerId + '@s.whatsapp.net')
                };

                if (logoBuffer) {
                    sendPayload.image = logoBuffer;
                } else {
                    sendPayload.text = msg;
                }

                await kaya.sendMessage(from, sendPayload);

                // Compteur et déclenchement de la pause après 10 envois
                welcomeCount++;
                if (welcomeCount >= MAX_WELCOMES) {
                    welcomeCount = 0;
                    pauseUntil = Date.now() + PAUSE_DURATION; // Pause de 10 min
                    console.log(`⚠️ Limite de ${MAX_WELCOMES} welcomes atteinte. Pause anti-ban de 10 minutes.`);
                    break;
                }
            }
        } catch (e) { /* silent */ }
    }
};
