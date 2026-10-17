// blockinbox.js
import { getSetting, setSetting } from '../setting.js';
import { usageBox, successBox, errorBox, boxMessage } from '../setting/theme.js';
import { getString } from '../setting/language.js';

export default {
    name: 'blockinbox',
    category: 'Owner',
    description: 'Block or allow the bot to receive private messages.',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Nettoyage sécurisé de l'ID du bot
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            const rawAction = args[0]?.toLowerCase();

            // 🔄 MAPPING DES COMMANDES SELON LA LANGUE (FR/EN)
            const actionMap = {
                "on": "on",
                "oui": "on",
                "yes": "on",

                "off": "off",
                "non": "off",
                "no": "off",

                "status": "status",
                "statut": "status"
            };

            const action = actionMap[rawAction];

            if (!action) {
                return kaya.sendMessage(from, {
                    text: usageBox(prefix, 'blockinbox', '<on/off/status>')
                }, { quoted: mek });
            }

            if (action === 'on') {
                setSetting(ownerId, 'blockInbox', true);
                return kaya.sendMessage(from, {
                    text: successBox(getString(ownerId, 'blockInboxBlockedMsg'))
                }, { quoted: mek });
            }

            if (action === 'off') {
                setSetting(ownerId, 'blockInbox', false);
                return kaya.sendMessage(from, {
                    text: successBox(getString(ownerId, 'blockInboxAllowedMsg'))
                }, { quoted: mek });
            }

            if (action === 'status') {
                const isBlocked = getSetting(ownerId, 'blockInbox', false);
                const statusText = `• *${getString(ownerId, 'blockInboxStatusLabel')} :* ${isBlocked ? '🚫 BLOCKED' : '✅ ALLOWED'}`;
                return kaya.sendMessage(from, {
                    text: boxMessage(getString(ownerId, 'blockInboxStatusTitle'), statusText, '📊')
                }, { quoted: mek });
            }

        } catch (err) {
            console.error('❌ blockinbox error:', err);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            await kaya.sendMessage(from, { 
                text: errorBox(getString(ownerId, 'blockInboxError')) 
            }, { quoted: mek });
        }
    }
};
