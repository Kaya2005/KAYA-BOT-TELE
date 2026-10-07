// commands/online.js
import { getSetting, setSetting } from '../setting.js';
import { usageBox, successBox, errorBox, boxMessage } from '../setting/theme.js';

const KEY_ALWAYS_ONLINE = 'always_online';
const activeIntervals = new Map();

// 🚀 Fonction exportée pour relancer automatiquement le mode online au démarrage/reconnexion
export function startAlwaysOnline(kaya) {
    try {
        const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
        if (!ownerId) return;
        const current = getSetting(ownerId, KEY_ALWAYS_ONLINE, false);
        
        if (current) {
            kaya.sendPresenceUpdate('available').catch(() => {});
            if (activeIntervals.has(ownerId)) clearInterval(activeIntervals.get(ownerId));
            const interval = setInterval(async () => {
                try {
                    await kaya.sendPresenceUpdate('available');
                } catch (e) {}
            }, 30000);
            activeIntervals.set(ownerId, interval);
        }
    } catch (err) {
        console.error('❌ Error in startAlwaysOnline:', err);
    }
}

export default {
    name: 'online',
    aliases: ['alwaysonline', 'autoonline'],
    description: '🤖 Keeps the online presence status active',
    category: 'System',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user.id.split(':')[0];
            const sub = String(args[0] || '').toLowerCase();
            const current = getSetting(ownerId, KEY_ALWAYS_ONLINE, false);

            if (sub === 'on') {
                setSetting(ownerId, KEY_ALWAYS_ONLINE, true);
                await kaya.sendPresenceUpdate('available');
                
                if (activeIntervals.has(ownerId)) clearInterval(activeIntervals.get(ownerId));
                const interval = setInterval(async () => {
                    try {
                        await kaya.sendPresenceUpdate('available');
                    } catch (e) {}
                }, 30000);
                activeIntervals.set(ownerId, interval);

                return await kaya.sendMessage(from, { text: successBox("Online mode enabled.") }, { quoted: mek });
            }

            if (sub === 'off') {
                setSetting(ownerId, KEY_ALWAYS_ONLINE, false);
                if (activeIntervals.has(ownerId)) {
                    clearInterval(activeIntervals.get(ownerId));
                    activeIntervals.delete(ownerId);
                }
                await kaya.sendPresenceUpdate('unavailable');
                return await kaya.sendMessage(from, { text: successBox("Online mode disabled.") }, { quoted: mek });
            }

            const content = `Status: ${current ? 'ON' : 'OFF'}\n\n` +
                            `• ${prefix}online on\n` +
                            `• ${prefix}online off`;

            const msgText = boxMessage('Online Status', content, '📊');

            await kaya.sendMessage(from, { text: msgText }, { quoted: mek });

        } catch (err) {
            console.error('❌ Error in online.js :', err);
            await kaya.sendMessage(from, { text: errorBox(`An error occurred: ${err.message}`) }, { quoted: mek });
        }
    }
};
