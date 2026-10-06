import { getSetting, setSetting } from '../setting.js';

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
                    text: `🔒 *Private Inbox Settings*\n\nUsage:\n${prefix}blockinbox on\n${prefix}blockinbox off\n${prefix}blockinbox status`
                }, { quoted: mek });
            }

            if (action === 'on') {
                setSetting(ownerId, 'blockInbox', true);
                return kaya.sendMessage(from, {
                    text: '🚫 The bot is now blocking all private messages.'
                }, { quoted: mek });
            }

            if (action === 'off') {
                setSetting(ownerId, 'blockInbox', false);
                return kaya.sendMessage(from, {
                    text: '✅ The bot is now accepting private messages.'
                }, { quoted: mek });
            }

            if (action === 'status') {
                const isBlocked = getSetting(ownerId, 'blockInbox', false);
                return kaya.sendMessage(from, {
                    text: `🔒 *Private Inbox:* ${isBlocked ? '🚫 BLOCKED' : '✅ ALLOWED'}`
                }, { quoted: mek });
            }

        } catch (err) {
            console.error('❌ blockinbox error:', err);
            await kaya.sendMessage(from, { text: '❌ An error occurred.' }, { quoted: mek });
        }
    }
};
