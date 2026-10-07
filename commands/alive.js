// ==================== commands/alive.js ====================
import { getBotName } from '../setting/botAssets.js';
import { boxMessage, errorBox } from '../setting/theme.js';

export default {
    name: 'alive',
    description: '🤖 Vérifie si le bot est en ligne',
    category: 'General',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const sender = mek.sender;
            const botName = getBotName(sender);
            
            const content = 
                `*ʙᴏᴛ ɴᴀᴍᴇ :* ${botName}\n` +
                `*sᴛᴀᴛᴜs :* ᴀᴄᴛɪᴠᴇ & ʀᴜɴɴɪɴɢ\n` +
                `*ᴘʀᴇғɪx :* ${prefix}\n` +
                `*ᴍᴏᴅᴇ :* ᴘᴜʙʟɪᴄ\n\n` +
                `_ᴛʏᴘᴇ \`${prefix}ᴍᴇɴᴜ\` ғᴏʀ ᴄᴍᴅs._`;

            const message = boxMessage('system alive', content, '🟢');

            await kaya.sendMessage(from, { text: message }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans alive.js :', err);
            await kaya.sendMessage(from, { text: errorBox('ᴜɴᴀʙʟᴇ ᴛᴏ ᴄʜᴇᴄᴋ sᴛᴀᴛᴜs.') }, { quoted: mek });
        }
    }
};
