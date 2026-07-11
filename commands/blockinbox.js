import { getSetting, setSetting } from '../setting.js';

export default {
    name: 'blockinbox',
    category: 'Owner',
    description: 'Block or allow the bot to receive private messages.',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const botJid = kaya.user.id;
            const action = args[0]?.toLowerCase();

            if (!['on', 'off', 'status'].includes(action)) {
                return kaya.sendMessage(from, {
                    text: `🔒 *Private Inbox Settings*\n\nUsage:\n${prefix}blockinbox on\n${prefix}blockinbox off\n${prefix}blockinbox status`
                }, { quoted: mek });
            }

            if (action === 'on') {
                setSetting(botJid, 'blockInbox', true);
                return kaya.sendMessage(from, {
                    text: '🚫 The bot is now blocking all private messages.'
                }, { quoted: mek });
            }

            if (action === 'off') {
                setSetting(botJid, 'blockInbox', false);
                return kaya.sendMessage(from, {
                    text: '✅ The bot is now accepting private messages.'
                }, { quoted: mek });
            }

            if (action === 'status') {
                const isBlocked = getSetting(botJid, 'blockInbox', false);
                return kaya.sendMessage(from, {
                    text: `🔒 *Private Inbox:* ${isBlocked ? '🚫 BLOCKED' : '✅ ALLOWED'}`
                }, { quoted: mek });
            }

        } catch (err) {
            console.error('❌ blockinbox error:', err);
        }
    }
};