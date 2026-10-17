// commands/online.js
import { getSetting, setSetting } from '../setting.js';
import { usageBox, successBox, errorBox, boxMessage } from '../setting/theme.js';
import { getString } from '../setting/language.js';

const KEY_ALWAYS_ONLINE = 'always_online';
const activeIntervals = new Map();

// 🚀 Fonction exportée pour relancer automatiquement le mode online au démarrage/reconnexion
export function startAlwaysOnline(kaya) {
    try {
        const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
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
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            const rawSub = String(args[0] || '').toLowerCase();
            const current = getSetting(ownerId, KEY_ALWAYS_ONLINE, false);

            // 🔄 MAPPING DES SOUS-COMMANDES SELON LA LANGUE (FR/EN)
            const subMap = {
                "on": "on",
                "oui": "on",
                "yes": "on",
                "1": "on",

                "off": "off",
                "non": "off",
                "no": "off",
                "0": "off"
            };

            const sub = subMap[rawSub];

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

                return await kaya.sendMessage(from, { text: successBox(getString(ownerId, 'onlineEnabledMsg')) }, { quoted: mek });
            }

            if (sub === 'off') {
                setSetting(ownerId, KEY_ALWAYS_ONLINE, false);
                if (activeIntervals.has(ownerId)) {
                    clearInterval(activeIntervals.get(ownerId));
                    activeIntervals.delete(ownerId);
                }
                await kaya.sendPresenceUpdate('unavailable');
                return await kaya.sendMessage(from, { text: successBox(getString(ownerId, 'onlineDisabledMsg')) }, { quoted: mek });
            }

            const content = 
                `• *${getString(ownerId, 'onlineStatusLabel')} :*${current ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off')}\n\n` +
                `• \`${prefix}online on / oui\`\n` +
                `• \`${prefix}online off / non\``;

            const msgText = boxMessage(getString(ownerId, 'onlineMenuTitle'), content, '📊');

            await kaya.sendMessage(from, { text: msgText }, { quoted: mek });

        } catch (err) {
            console.error('❌ Error in online.js :', err);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            await kaya.sendMessage(from, { text: errorBox(`${getString(ownerId, 'onlineError')} : ${err.message}`) }, { quoted: mek });
        }
    }
};
