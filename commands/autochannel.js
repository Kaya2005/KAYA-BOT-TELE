// ==================== commands/autochannel.js ====================
import { getSetting, setSetting } from '../setting.js';
import { boxMessage, errorBox } from '../setting/theme.js';
import { getString } from '../setting/language.js';

export default {
    name: 'autochannel',
    aliases: ['autochannelreact', 'channelreact'],
    description: '📢 Automatic reaction to messages in WhatsApp channels',
    category: 'Admin',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
            const action = args[0]?.toLowerCase();

            // If no argument or invalid argument provided, display help and current status
            if (!action || !['on', 'off'].includes(action)) {
                const currentStatus = Boolean(getSetting(ownerId, 'autochannel', false));
                const statusText = currentStatus ? '🟢 ENABLED' : '🔴 DISABLED';

                const content = 
                    `*Current Status:* ${statusText}\n\n` +
                    `*Usage:*\n` +
                    `┆ 💻 \`${prefix}autochannel on\` — Enable channel reactions\n` +
                    `┆ 💻 \`${prefix}autochannel off\` — Disable channel reactions`;

                const message = boxMessage('📢 AUTO-CHANNEL SETUP', content, '⚙️');

                return await kaya.sendMessage(from, { text: message }, { quoted: mek });
            }

            if (action === 'on') {
                setSetting(ownerId, 'autochannel', true);

                const content = '✅ *Auto-reaction for Channels enabled!*\nThe bot will now automatically react with a random emoji to every post in your WhatsApp channels.';
                const message = boxMessage('📢 AUTO-CHANNEL', content, '✅');

                return await kaya.sendMessage(from, { text: message }, { quoted: mek });
            }

            if (action === 'off') {
                setSetting(ownerId, 'autochannel', false);

                const content = '❌ *Auto-reaction for Channels disabled!*';
                const message = boxMessage('📢 AUTO-CHANNEL', content, '🔴');

                return await kaya.sendMessage(from, { text: message }, { quoted: mek });
            }

        } catch (err) {
            console.error('❌ Error in autochannel.js :', err);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
            await kaya.sendMessage(from, { text: errorBox('An error occurred while configuring Auto-Channel.') }, { quoted: mek });
        }
    }
};
