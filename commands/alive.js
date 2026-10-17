// ==================== commands/alive.js ====================
import { getBotName } from '../setting/botAssets.js';
import { boxMessage, errorBox } from '../setting/theme.js';
import { getString } from '../setting/language.js';

export default {
    name: 'alive',
    description: '🤖 Vérifie si le bot est en ligne',
    category: 'General',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const sender = mek.sender;
            const botName = getBotName(sender);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
            
            const content = 
                `*${getString(ownerId, 'aliveBotName')} :* ${botName}\n` +
                `*${getString(ownerId, 'aliveStatus')} :* ${getString(ownerId, 'aliveActive')}\n` +
                `*${getString(ownerId, 'alivePrefix')} :* ${prefix}\n` +
                `*${getString(ownerId, 'aliveMode')} :* ${getString(ownerId, 'alivePublic')}\n\n` +
                `_${getString(ownerId, 'aliveTypeMenu').replace('{prefix}', prefix)}_`;

            const message = boxMessage(getString(ownerId, 'aliveTitle'), content, '🟢');

            await kaya.sendMessage(from, { text: message }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans alive.js :', err);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
            await kaya.sendMessage(from, { text: errorBox(getString(ownerId, 'aliveError')) }, { quoted: mek });
        }
    }
};
