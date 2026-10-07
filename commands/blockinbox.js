import { getSetting, setSetting } from '../setting.js';
import { usageBox, successBox, errorBox } from '../setting/theme.js';

export default {
    name: 'blockinbox',
    category: 'Owner',
    description: 'Block or allow the bot to receive private messages.',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Nettoyage de l'ID du bot pour obtenir uniquement la partie numérique
            const ownerId = kaya.user.id.split(':')[0];
            const action = args[0]?.toLowerCase();

            if (!['on', 'off', 'status'].includes(action)) {
                return kaya.sendMessage(from, {
                    text: usageBox(prefix, 'blockinbox', '<on/off/status>')
                }, { quoted: mek });
            }

            if (action === 'on') {
                setSetting(ownerId, 'blockInbox', true);
                return kaya.sendMessage(from, {
                    text: successBox('The bot is now blocking all private messages.')
                }, { quoted: mek });
            }

            if (action === 'off') {
                setSetting(ownerId, 'blockInbox', false);
                return kaya.sendMessage(from, {
                    text: successBox('The bot is now accepting private messages.')
                }, { quoted: mek });
            }

            if (action === 'status') {
                const isBlocked = getSetting(ownerId, 'blockInbox', false);
                const statusText = `Private Inbox: ${isBlocked ? '🚫 BLOCKED' : '✅ ALLOWED'}`;
                return kaya.sendMessage(from, {
                    text: successBox(statusText)
                }, { quoted: mek });
            }

        } catch (err) {
            console.error('❌ blockinbox error:', err);
            await kaya.sendMessage(from, { text: errorBox('An error occurred.') }, { quoted: mek });
        }
    }
};
