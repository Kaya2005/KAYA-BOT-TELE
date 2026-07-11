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
            const sender = mek.sender;
            const action = args[0]?.toLowerCase();

            if (!['on', 'off', 'mode', 'status'].includes(action)) {
                return kaya.sendMessage(from, { text: `🎭 *Auto-React Settings*\n\nUsage:\n${prefix}autoreact on/off\n${prefix}autoreact mode <private/group/all>\n${prefix}autoreact status` }, { quoted: mek });
            }

            if (action === 'on') {
                setSetting(sender, 'autoreact', true);
                return kaya.sendMessage(from, { text: '✅ *Auto-react enabled.*' }, { quoted: mek });
            }

            if (action === 'off') {
                setSetting(sender, 'autoreact', false);
                return kaya.sendMessage(from, { text: '❌ *Auto-react disabled.*' }, { quoted: mek });
            }

            if (action === 'mode') {
                const mode = args[1]?.toLowerCase();
                if (!['private', 'group', 'all'].includes(mode)) {
                    return kaya.sendMessage(from, { text: '❌ *Invalid mode!* Use: private, group, or all.' }, { quoted: mek });
                }
                setSetting(sender, 'autoreactMode', mode);
                return kaya.sendMessage(from, { text: `✅ *Mode set to: ${mode.toUpperCase()}*` }, { quoted: mek });
            }

            if (action === 'status') {
                const isEnabled = getSetting(sender, 'autoreact', false);
                const mode = getSetting(sender, 'autoreactMode', 'all');
                return kaya.sendMessage(from, { text: `🎭 *Status:* ${isEnabled ? '✅' : '❌'}\n📍 *Mode:* ${mode.toUpperCase()}` }, { quoted: mek });
            }
        } catch (err) {
            console.error('❌ autoreact error:', err);
        }
    },

    async listen(kaya, mek, from) {
        try {
            if (mek.key?.fromMe) return;
            
            // On vérifie le réglage de l'expéditeur
            const isEnabled = getSetting(mek.sender, 'autoreact', false);
            if (!isEnabled) return;

            const mode = getSetting(mek.sender, 'autoreactMode', 'all');
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
