import { getSetting, setSetting } from '../setting.js';

// 🛡️ Suivi anti-ban isolé par utilisateur (clé = ownerId)
const userRateLimits = new Map();

const KEY_VIEW = 'autostatus_view';
const KEY_LIKE = 'autostatus_like';
const KEY_EMOJI = 'autostatus_emoji';

const readState = (ownerId) => {
    const view = getSetting(ownerId, KEY_VIEW, true);
    const like = getSetting(ownerId, KEY_LIKE, true);
    const emoji = getSetting(ownerId, KEY_EMOJI, '💚');

    return {
        autoView: typeof view === 'boolean' ? view : true,
        autoLike: typeof like === 'boolean' ? like : true,
        likeEmoji: typeof emoji === 'string' && emoji.trim() ? emoji.trim() : '💚'
    };
};

export default {
    name: 'autostatus',
    aliases: ['statusauto', 'autostory'],
    description: '🤖 Auto view et auto like des statuts WhatsApp',
    category: 'Owner',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user.id.split(':')[0];
            const sub = String(args[0] || '').toLowerCase();
            const state = readState(ownerId);

            if (!sub) {
                const currentState = readState(ownerId);
                const msgText = `📊 *Auto Status*\n` +
                    `View: ${currentState.autoView ? 'ON' : 'OFF'}\n` +
                    `Like: ${currentState.autoLike ? 'ON' : 'OFF'}\n` +
                    `Emoji: ${currentState.likeEmoji}\n\n` +
                    `${prefix}autostatus on\n` +
                    `${prefix}autostatus off\n` +
                    `${prefix}autostatus view on\n` +
                    `${prefix}autostatus like on\n` +
                    `${prefix}autostatus 🔥`;

                return await kaya.sendMessage(from, { text: msgText }, { quoted: mek });
            }

            if (sub === 'on') {
                setSetting(ownerId, KEY_VIEW, true);
                setSetting(ownerId, KEY_LIKE, true);
                return await kaya.sendMessage(from, { text: `✅ Auto status view and like enabled.\nEmoji: ${state.likeEmoji}` }, { quoted: mek });
            }

            if (sub === 'off') {
                setSetting(ownerId, KEY_VIEW, false);
                setSetting(ownerId, KEY_LIKE, false);
                return await kaya.sendMessage(from, { text: '✅ Auto status view and like disabled.' }, { quoted: mek });
            }

            if (sub === 'view') {
                const next = String(args[1] || '').toLowerCase();
                if (!['on', 'off'].includes(next)) {
                    return await kaya.sendMessage(from, { text: `❌ Usage: ${prefix}autostatus view <on|off>` }, { quoted: mek });
                }
                setSetting(ownerId, KEY_VIEW, next === 'on');
                return await kaya.sendMessage(from, { text: `✅ Auto status view ${next === 'on' ? 'enabled' : 'disabled'}.` }, { quoted: mek });
            }

            if (sub === 'like') {
                const next = String(args[1] || '').toLowerCase();
                if (!['on', 'off'].includes(next)) {
                    return await kaya.sendMessage(from, { text: `❌ Usage: ${prefix}autostatus like <on|off>` }, { quoted: mek });
                }
                setSetting(ownerId, KEY_LIKE, next === 'on');
                return await kaya.sendMessage(from, { text: `✅ Auto status like ${next === 'on' ? 'enabled' : 'disabled'}.` }, { quoted: mek });
            }

            if (sub === 'emoji') {
                const emoji = String(args[1] || '').trim();
                if (!emoji) {
                    return await kaya.sendMessage(from, { text: `❌ Usage: ${prefix}autostatus 💚` }, { quoted: mek });
                }
                setSetting(ownerId, KEY_EMOJI, emoji);
                return await kaya.sendMessage(from, { text: `✅ Auto status like emoji set to ${emoji}` }, { quoted: mek });
            }

            const emoji = String(args[0] || '').trim();
            if (emoji) {
                setSetting(ownerId, KEY_EMOJI, emoji);
                return await kaya.sendMessage(from, { text: `✅ Auto status like emoji set to ${emoji}` }, { quoted: mek });
            }

        } catch (err) {
            await kaya.sendMessage(from, { text: `⚠️ Une erreur est survenue : ${err.message}` }, { quoted: mek });
        }
    },

    async detect(kaya, mek, from) {
        try {
            if (from !== 'status@broadcast' || mek.key.fromMe) return;

            const ownerId = kaya.user.id.split(':')[0];
            const participant = mek.key.participant || mek.participant || '';

            const state = readState(ownerId);
            if (!state.autoView && !state.autoLike) return;

            // 🛡️ Gestion de l'anti-ban isolé par utilisateur (totalement silencieuse)
            const now = Date.now();
            if (!userRateLimits.has(ownerId)) {
                userRateLimits.set(ownerId, { lastAction: 0, count: 0 });
            }
            const userLimit = userRateLimits.get(ownerId);

            if (now - userLimit.lastAction > 60000) {
                userLimit.count = 0;
                userLimit.lastAction = now;
            }

            if (userLimit.count > 30) {
                return; // Sortie silencieuse sans aucun log
            }
            userLimit.count++;

            const statusKey = {
                remoteJid: 'status@broadcast',
                id: mek.key.id,
                participant: participant,
                fromMe: false
            };

            if (state.autoView) {
                try {
                    await kaya.readMessages([statusKey]);
                } catch {}
            }

            if (state.autoLike) {
                try {
                    await kaya.sendMessage('status@broadcast', {
                        react: { text: state.likeEmoji, key: statusKey }
                    }, { statusJidList: [participant] });
                } catch {}
            }
        } catch (e) {}
    }
};
