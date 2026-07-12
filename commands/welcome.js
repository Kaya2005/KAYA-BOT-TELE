import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

const welcomeCache = new Set();

// Context en dur pour assurer la stabilité
const cInfo = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363410993553528@newsletter',
        newsletterName: '𝐊𝐀𝐘𝐀 𝐁𝐎𝐓'
    }
};

export default {
    name: 'welcome',
    alias: ['bienvenue', 'wel'],
    description: 'Gestion des messages de bienvenue',
    category: 'Group',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const status = await checkAdminOrOwner(kaya, from, mek.sender);
            if (!status.isBotOwner) return kaya.sendMessage(from, { text: '❌ Owner Only', contextInfo: cInfo }, { quoted: mek });
            
            const action = args[0]?.toLowerCase();
            const groupId = from.split('@')[0];

            if (action === "on") {
                setSetting(groupId, 'welcomeEnabled', true);
                return kaya.sendMessage(from, { text: "✅ Welcome activé pour ce groupe.", contextInfo: cInfo }, { quoted: mek });
            } else if (action === "off") {
                setSetting(groupId, 'welcomeEnabled', false);
                return kaya.sendMessage(from, { text: "❌ Welcome désactivé pour ce groupe.", contextInfo: cInfo }, { quoted: mek });
            } else if (action === "all") {
                setSetting('global', 'welcomeEnabled', true);
                return kaya.sendMessage(from, { text: "✅ Welcome activé globalement.", contextInfo: cInfo }, { quoted: mek });
            }
            const isEnabled = getSetting(groupId, 'welcomeEnabled', false);
            return kaya.sendMessage(from, { text: `📊 *WELCOME STATUS*\n\nÉtat: ${isEnabled ? "ON" : "OFF"}`, contextInfo: cInfo }, { quoted: mek });
        } catch (e) { console.error(e); }
    },

    async participantUpdate(kaya, update) {
        try {
            if (update.action !== "add") return;
            const from = update.id;
            const groupId = from.split('@')[0];
            
            const isEnabled = getSetting(groupId, 'welcomeEnabled', false) || getSetting('global', 'welcomeEnabled', false);
            if (!isEnabled) return;

            for (let user of update.participants) {
                const userId = typeof user === 'string' ? user : user.id;
                if (welcomeCache.has(userId)) continue;
                welcomeCache.add(userId);
                setTimeout(() => welcomeCache.delete(userId), 10000);

                let ppUrl;
                try {
                    ppUrl = await kaya.profilePictureUrl(userId, 'image');
                } catch {
                    ppUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
                }

                // Message simplifié sans les variables de métadonnées qui causaient l'erreur
                const msg = `▉ \`WELCOME\` ▉\n\nBienvenue dans le groupe ! ✨`.trim();

                await kaya.sendMessage(from, {
                    image: { url: ppUrl },
                    caption: msg,
                    mentions: [userId],
                    contextInfo: cInfo
                });
            }
        } catch (e) { 
            console.log("ERREUR CRITIQUE WELCOME :", e); 
        }
    }
};
