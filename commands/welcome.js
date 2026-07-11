//welcome.js
import { getContextInfo } from '../setting/contextInfo.js';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getSetting, setSetting } from '../setting.js';

export default {
    name: 'welcome',
    alias: ['bienvenue', 'wel'],
    description: 'Enable/disable welcome messages',
    category: 'Group',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const status = await checkAdminOrOwner(kaya, from, mek.sender);

            if (!status.isBotOwner) {
                return kaya.sendMessage(from, { text: '❌ Owner Only' });
            }

            const action = args.join(' ').toLowerCase();
            // Nettoyage du JID pour la cohérence avec le système de fichiers
            const groupId = from.split('@')[0];

            if (!action) {
                return kaya.sendMessage(from, {
                    text: `⚙️ *WELCOME SETTINGS*\n\n${prefix}welcome on\n${prefix}welcome off\n${prefix}welcome status`
                });
            }

            if (action === "on") {
                setSetting(groupId, 'welcomeEnabled', true);
                return kaya.sendMessage(from, { text: "✅ Welcome activé pour ce groupe." });
            }

            if (action === "off") {
                setSetting(groupId, 'welcomeEnabled', false);
                return kaya.sendMessage(from, { text: "❌ Welcome désactivé pour ce groupe." });
            }

            if (action === "status") {
                const isEnabled = getSetting(groupId, 'welcomeEnabled', false);
                return kaya.sendMessage(from, {
                    text: `📊 *WELCOME STATUS*\n\nÉtat: ${isEnabled ? "ON" : "OFF"}`
                });
            }

        } catch (e) {
            console.error("welcome command error:", e);
        }
    },

    async detect(kaya, update, from) {
        try {
            // 1. On ne traite que les ajouts
            if (update.action !== "add") return;

            // 2. Nettoyage du JID et vérification si activé
            const groupId = from.split('@')[0];
            const isEnabled = getSetting(groupId, 'welcomeEnabled', false);
            
            console.log(`DEBUG: Checking welcome for ${groupId}, enabled: ${isEnabled}`);
            
            if (!isEnabled) return;

            // 3. Récupération des infos du groupe
            const metadata = await kaya.groupMetadata(from).catch(() => ({ subject: "ce groupe" }));

            // 4. Envoi du message pour chaque nouvel utilisateur
            for (const user of update.participants) {
                const msg = `👋 *WELCOME*\n\n👤 User: @${user.split("@")[0]}\n👥 Group: ${metadata.subject}\n\n✨ Welcome to the family!`;

                await kaya.sendMessage(from, {
                    text: msg,
                    mentions: [user],
                    contextInfo: {
                        ...getContextInfo(),
                        mentionedJid: [user]
                    }
                });
            }
        } catch (e) {
            console.error("Welcome detect error:", e);
        }
    }
};
