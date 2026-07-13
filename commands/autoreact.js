// autoreact.js
import { getSetting, setSetting } from '../setting.js';

const RANDOM_EMOJIS = ['❤️','😂','🎉','👍','🔥','😮','😢','🤔','👏','🎊','🤯','😍','🥰','😎','🤩','😭','💯','✨','🌟','💔','💖','💕','💙','💚','💛','💜','🖤','🤍','🧡','💘','💝','💞','😊','😇','🥳','😋','😜','🤪','😝','🤑','🤗','🤭','🤫','😴','🤖','👻','💀'];
const getRandomEmoji = () => RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)];

export default {
    name: 'autoreact',
    category: 'Owner',
    description: 'Configure auto-reaction mode',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // On utilise l'ID du bot pour que le réglage soit global à l'instance
            const ownerId = kaya.user.id.split(':')[0];
            const action = args[0]?.toLowerCase();

            if (!['on', 'off', 'mode', 'status'].includes(action)) {
                return kaya.sendMessage(from, { text: `🎭 *Auto-React Settings*\n\nUsage:\n${prefix}autoreact on/off\n${prefix}autoreact mode <private/group/all>\n${prefix}autoreact status` }, { quoted: mek });
            }

            if (action === 'on') {
                setSetting(ownerId, 'autoreact', true);
                return kaya.sendMessage(from, { text: '✅ *Auto-react enabled.*' }, { quoted: mek });
            }

            if (action === 'off') {
                setSetting(ownerId, 'autoreact', false);
                return kaya.sendMessage(from, { text: '❌ *Auto-react disabled.*' }, { quoted: mek });
            }

            if (action === 'mode') {
                const mode = args[1]?.toLowerCase();
                if (!['private', 'group', 'all'].includes(mode)) {
                    return kaya.sendMessage(from, { text: '❌ *Invalid mode!* Use: private, group, or all.' }, { quoted: mek });
                }
                setSetting(ownerId, 'autoreactMode', mode);
                return kaya.sendMessage(from, { text: `✅ *Mode set to: ${mode.toUpperCase()}*` }, { quoted: mek });
            }

            if (action === 'status') {
                const isEnabled = getSetting(ownerId, 'autoreact', false);
                const mode = getSetting(ownerId, 'autoreactMode', 'all');
                return kaya.sendMessage(from, { text: `🎭 *Status:* ${isEnabled ? '✅' : '❌'}\n📍 *Mode:* ${mode.toUpperCase()}` }, { quoted: mek });
            }
        } catch (err) {
            console.error('❌ autoreact error:', err);
        }
    },

    async listen(kaya, mek, from) {
        try {
            if (mek.key?.fromMe) return;
            
            const ownerId = kaya.user.id.split(':')[0];
            
            // On vérifie le réglage global du bot
            const isEnabled = getSetting(ownerId, 'autoreact', false);
            if (!isEnabled) return;

            const mode = getSetting(ownerId, 'autoreactMode', 'all');
            const isGroup = from.endsWith('@g.us');

            // Filtrage selon le mode choisi
            if (mode === 'private' && isGroup) return;
            if (mode === 'group' && !isGroup) return;

            await kaya.sendMessage(from, { react: { text: getRandomEmoji(), key: mek.key } });
        } catch (err) {
            console.error('❌ Auto-react listen error:', err);
        }
    }
};
