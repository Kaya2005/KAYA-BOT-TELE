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

            if (!action) {
                return kaya.sendMessage(from, {
                    text: `⚙️ *WELCOME SETTINGS*\n\n${prefix}welcome on\n${prefix}welcome off\n${prefix}welcome status`
                });
            }

            if (action === "on") {
                setSetting(from, 'welcomeEnabled', true);
                return kaya.sendMessage(from, { text: "✅ Welcome activé pour ce groupe." });
            }

            if (action === "off") {
                setSetting(from, 'welcomeEnabled', false);
                return kaya.sendMessage(from, { text: "❌ Welcome désactivé pour ce groupe." });
            }

            if (action === "status") {
                const isEnabled = getSetting(from, 'welcomeEnabled', false);
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

            // 2. Vérification si activé (from est ici le JID du groupe complet)
            const isEnabled = getSetting(from, 'welcomeEnabled', false);
            if (!isEnabled) return;

            // 3. Récupération des infos du groupe
            const metadata = await kaya.groupMetadata(from).catch(() => ({ subject: "ce groupe" }));

            // 4. Envoi du message pour chaque nouvel utilisateur
            for (const user of update.participants) {
                const msg = `👋 *WELCOME*\n\n👤 User: @${user.split("@")[0]}\n👥 Group: ${metadata.subject}\n\n✨ Welcome to the family!`;

                await kaya.sendMessage(from, {
                    text: msg,
                    mentions: [user], // Ajout explicite pour forcer la mention
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
