// ==================== commands/alive.js ====================
import { getBotName } from '../setting/botAssets.js';

export default {
    name: 'alive',
    description: '🤖 Vérifie si le bot est en ligne',
    category: 'General',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const sender = mek.sender;
            const botName = getBotName(sender);
            
            const message = `*${botName} IS ONLINE* 🟢

*Status:* Active and running smoothly.
*Prefix:* ${prefix}
*Mode:* Public

_Type ${prefix}menu to see available commands._`;

            // ✅ Mise à jour : Utilisation de sendMessageLimited pour respecter la sécurité
            await kaya.sendMessageLimited(from, { text: message }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans alive.js :', err);
            // ✅ Mise à jour : Utilisation de sendMessageLimited ici aussi
            await kaya.sendMessageLimited(from, { text: '⚠️ Le bot est en ligne mais a rencontré une erreur lors de la réponse.' }, { quoted: mek });
        }
    }
};
