// ==================== commands/autostatus.js ====================
import { getSetting, setSetting } from '../setting.js';
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';
import { getString } from '../setting/language.js';

// 🛡️ Suivi anti-ban isolé par utilisateur (clé = ownerId)
const userRateLimits = new Map();

const KEY_VIEW = 'autostatus_view';
const KEY_LIKE = 'autostatus_like';
const KEY_EMOJI = 'autostatus_emoji';

const readState = (ownerId) => {
    const view = getSetting(ownerId, KEY_VIEW, false);
    const like = getSetting(ownerId, KEY_LIKE, false);
    const emoji = getSetting(ownerId, KEY_EMOJI, '💚');

    return {
        autoView: typeof view === 'boolean' ? view : false,
        autoLike: typeof like === 'boolean' ? like : false,
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
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            const rawSub = String(args[0] || '').toLowerCase();
            const state = readState(ownerId);

            // 🔄 MAPPING DES COMMANDES SELON LA LANGUE (FR/EN)
            const subMap = {
                "on": "on",
                "oui": "on",
                "yes": "on",

                "off": "off",
                "non": "off",
                "no": "off",

                "view": "view",
                "vu": "view",
                "vue": "view",

                "like": "like",
                "jaime": "like",
                "j'aime": "like",

                "emoji": "emoji"
            };

            const sub = subMap[rawSub] || rawSub;

            if (!rawSub) {
                const currentState = readState(ownerId);
                const menuContent = 
                    `• *${getString(ownerId, 'autoStatusViewLabel')} :*${currentState.autoView ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off')}\n` +
                    `• *${getString(ownerId, 'autoStatusLikeLabel')} :*${currentState.autoLike ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off')}\n` +
                    `• *${getString(ownerId, 'autoStatusEmojiLabel')} :*${currentState.likeEmoji}\n\n` +
                    `• \`${prefix}autostatus on / oui\`\n` +
                    `• \`${prefix}autostatus off / non\`\n` +
                    `• \`${prefix}autostatus view / vue <on|off>\`\n` +
                    `• \`${prefix}autostatus like <on|off>\`\n` +
                    `• \`${prefix}autostatus emoji <emoji>\``;

                return await kaya.sendMessage(from, { 
                    text: boxMessage(getString(ownerId, 'autoStatusMenuTitle'), menuContent, '📊') 
                }, { quoted: mek });
            }

            if (sub === 'on') {
                setSetting(ownerId, KEY_VIEW, true);
                setSetting(ownerId, KEY_LIKE, true);
                
                const successContent = `${getString(ownerId, 'autoStatusEnabledMsg')}\n• *${getString(ownerId, 'autoStatusEmojiLabel')} :* ${state.likeEmoji}`;
                return await kaya.sendMessage(from, { 
                    text: successBox(successContent) 
                }, { quoted: mek });
            }

            if (sub === 'off') {
                setSetting(ownerId, KEY_VIEW, false);
                setSetting(ownerId, KEY_LIKE, false);
                return await kaya.sendMessage(from, { 
                    text: boxMessage('auto-status', getString(ownerId, 'autoStatusDisabledMsg'), '❌') 
                }, { quoted: mek });
            }

            if (sub === 'view') {
                const rawNext = String(args[1] || '').toLowerCase();
                const nextMap = { "on": "on", "oui": "on", "yes": "on", "off": "off", "non": "off", "no": "off" };
                const next = nextMap[rawNext];

                if (!next) {
                    return await kaya.sendMessage(from, { 
                        text: usageBox(prefix, 'autostatus view', '<on|off>') 
                    }, { quoted: mek });
                }
                setSetting(ownerId, KEY_VIEW, next === 'on');
                
                const viewText = `${getString(ownerId, 'autoStatusViewMsg')} ${next === 'on' ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off')}.`;
                return await kaya.sendMessage(from, { 
                    text: boxMessage('auto-status', viewText, '👁️') 
                }, { quoted: mek });
            }

            if (sub === 'like') {
                const rawNext = String(args[1] || '').toLowerCase();
                const nextMap = { "on": "on", "oui": "on", "yes": "on", "off": "off", "non": "off", "no": "off" };
                const next = nextMap[rawNext];

                if (!next) {
                    return await kaya.sendMessage(from, { 
                        text: usageBox(prefix, 'autostatus like', '<on|off>') 
                    }, { quoted: mek });
                }
                setSetting(ownerId, KEY_LIKE, next === 'on');
                
                const likeText = `${getString(ownerId, 'autoStatusLikeMsg')} ${next === 'on' ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off')}.`;
                return await kaya.sendMessage(from, { 
                    text: boxMessage('auto-status', likeText, '❤️') 
                }, { quoted: mek });
            }

            if (sub === 'emoji') {
                const emoji = String(args[1] || '').trim();
                if (!emoji) {
                    return await kaya.sendMessage(from, { 
                        text: usageBox(prefix, 'autostatus emoji', '💚') 
                    }, { quoted: mek });
                }
                setSetting(ownerId, KEY_EMOJI, emoji);
                
                const emojiText = `${getString(ownerId, 'autoStatusEmojiSet')} ${emoji}`;
                return await kaya.sendMessage(from, { 
                    text: successBox(emojiText) 
                }, { quoted: mek });
            }

            const emoji = String(args[0] || '').trim();
            if (emoji) {
                setSetting(ownerId, KEY_EMOJI, emoji);
                
                const emojiText = `${getString(ownerId, 'autoStatusEmojiSet')} ${emoji}`;
                return await kaya.sendMessage(from, { 
                    text: successBox(emojiText) 
                }, { quoted: mek });
            }

        } catch (err) {
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            await kaya.sendMessage(from, { 
                text: errorBox(`${getString(ownerId, 'autoStatusError')} : ${err.message}`) 
            }, { quoted: mek });
        }
    },

    async detect(kaya, mek, from) {
        try {
            if (from !== 'status@broadcast' || mek.key.fromMe) return;

            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            const participant = mek.key.participant || mek.participant || '';

            const state = readState(ownerId);
            if (!state.autoView && !state.autoLike) return;

            // 🛡️ Gestion de l'anti-ban isolé par utilisateur
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
                return;
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
