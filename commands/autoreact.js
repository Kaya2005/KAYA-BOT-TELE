// autoreact.js
import { getSetting, setSetting } from '../setting.js';
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';
import { getString } from '../setting/language.js';

const RANDOM_EMOJIS = ['❤️','😂','🎉','👍','🔥','😮','👏','🎊','🤯','😍','🥰','😎','🤩','💯','✨','🌟','💖','💕','💙','💚','💛','💜','🖤','🤍','🧡','😊','😇','🥳','😋','😜','🤪','🤗','🤭'];
const getRandomEmoji = () => RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)];

// AJOUT : Cache pour éviter de réagir 10 fois à la même seconde et limiter la fréquence
const lastReaction = new Map();
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
    name: 'autoreact',
    category: 'Owner',
    description: 'Configure auto-reaction mode',

    async execute(kaya, mek, from, args, prefix) {
        try {
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

                "mode": "mode",

                "status": "status",
                "statut": "status"
            };

            const action = actionMap[rawAction];

            if (!action) {
                const menuContent = 
                    `• \`${prefix}autoreact on / oui / off / non\`\n` +
                    `• \`${prefix}autoreact mode <private/group/all>\`\n` +
                    `• \`${prefix}autoreact status / statut\``;

                return kaya.sendMessage(from, { 
                    text: boxMessage(getString(ownerId, 'autoReactMenuTitle'), menuContent, '🎭') 
                }, { quoted: mek });
            }

            if (action === 'on') {
                setSetting(ownerId, 'autoreact', true);
                return kaya.sendMessage(from, { 
                    text: successBox(getString(ownerId, 'autoReactEnabledMsg')) 
                }, { quoted: mek });
            }

            if (action === 'off') {
                setSetting(ownerId, 'autoreact', false);
                return kaya.sendMessage(from, { 
                    text: boxMessage('auto-react', getString(ownerId, 'autoReactDisabledMsg'), '❌') 
                }, { quoted: mek });
            }

            if (action === 'mode') {
                const rawMode = args[1]?.toLowerCase();
                const modeMap = {
                    "private": "private",
                    "prive": "private",
                    "privé": "private",

                    "group": "group",
                    "groupe": "group",

                    "all": "all",
                    "tout": "all"
                };

                const mode = modeMap[rawMode];

                if (!mode) {
                    return kaya.sendMessage(from, { 
                        text: usageBox(prefix, 'autoreact mode', '<private/group/all>') 
                    }, { quoted: mek });
                }
                setSetting(ownerId, 'autoreactMode', mode);

                const translatedMode = getString(ownerId, `mode_${mode}`) || mode.toUpperCase();

                return kaya.sendMessage(from, { 
                    text: successBox(`${getString(ownerId, 'autoReactModeSet')}\n*${translatedMode}*`) 
                }, { quoted: mek });
            }

            if (action === 'status') {
                const isEnabled = getSetting(ownerId, 'autoreact', false);
                const mode = getSetting(ownerId, 'autoreactMode', 'all');
                
                const statusValue = isEnabled ? `${getString(ownerId, 'mode_on')} ✅` : `${getString(ownerId, 'mode_off')} ❌`;
                const translatedMode = getString(ownerId, `mode_${mode}`) || mode.toUpperCase();

                const statusContent = `• *${getString(ownerId, 'autoReactStatusLabel')} :* ${statusValue}\n• *${getString(ownerId, 'autoReactModeLabel')} :* ${translatedMode}`;
                return kaya.sendMessage(from, { 
                    text: boxMessage(getString(ownerId, 'autoReactStatusTitle'), statusContent, '📊') 
                }, { quoted: mek });
            }
        } catch (err) { 
            console.error('❌ autoreact error:', err);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            await kaya.sendMessage(from, { 
                text: errorBox(getString(ownerId, 'autoReactError')) 
            }, { quoted: mek });
        }
    },

    async listen(kaya, mek, from) {
        try {
            if (mek.key?.fromMe) return;
            
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            const isEnabled = getSetting(ownerId, 'autoreact', false);
            if (!isEnabled) return;

            // SÉCURITÉ : Cooldown de 10 secondes par chat pour éviter le flood
            const now = Date.now();
            if (lastReaction.has(from) && now - lastReaction.get(from) < 10000) return;
            lastReaction.set(from, now);

            const mode = getSetting(ownerId, 'autoreactMode', 'all');
            const isGroup = from.endsWith('@g.us');

            if (mode === 'private' && isGroup) return;
            if (mode === 'group' && !isGroup) return;

            // SÉCURITÉ : Petit délai aléatoire pour simuler une lecture humaine
            await delay(Math.floor(Math.random() * 2000) + 1000); 
            
            await kaya.sendMessage(from, { react: { text: getRandomEmoji(), key: mek.key } });
        } catch (err) {
            console.error('❌ Auto-react listen error:', err);
        }
    }
};
