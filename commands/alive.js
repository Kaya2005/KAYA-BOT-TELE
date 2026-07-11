// ==================== commands/alive.js ====================
import { getBotName } from '../setting/botAssets.js';

export default {
    name: 'alive',
    description: '🤖 Vérifie si le bot est en ligne',
    category: 'Main',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const sender = mek.sender;
            const botName = getBotName(sender);
            
            const message = `*${botName} IS ONLINE* 🟢

*Status:* Active and running smoothly.
*Prefix:* ${prefix}
*Mode:* Public

_Type ${prefix}menu to see available commands._`;

            await kaya.sendMessage(from, { text: message }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans alive.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ Le bot est en ligne mais a rencontré une erreur lors de la réponse.' }, { quoted: mek });
        }
    }
};
