// ==================== commands/delprefix.js ====================
import { getSetting, setSetting } from '../setting.js';
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';

export default {
    name: 'delprefix',
    aliases: ['prefixmode', 'noprefix'],
    description: 'Enable or disable prefix requirement',
    category: 'System',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user.id.split(':')[0];
            const sub = args[0]?.toLowerCase();

            if (!sub) {
                const currentPrefix = getSetting(ownerId, 'prefix', '.');
                const noPrefix = getSetting(ownerId, 'noPrefix', false);
                
                const menuContent = 
                    `• *ᴄᴜʀʀᴇɴᴛ ᴘʀᴇғɪx :* \`${currentPrefix}\`\n` +
                    `• *ɴᴏ-ᴘʀᴇғɪx ᴍᴏᴅᴇ :* ${noPrefix ? 'ᴀᴄᴛɪᴠᴇ ✅' : 'ɪɴᴀᴄᴛɪᴠᴇ ❌'}\n\n` +
                    `• \`${prefix}delprefix on\`\n` +
                    `• \`${prefix}delprefix off\``;

                return await kaya.sendMessage(from, { 
                    text: boxMessage('prefix management', menuContent, '⚙️') 
                }, { quoted: mek });
            }

            if (sub === 'on') {
                setSetting(ownerId, 'noPrefix', true);
                const successContent = `ᴘʀᴇғɪx ᴅɪsᴀʙʟᴇᴅ (ɴᴏ-ᴘʀᴇғɪx ᴍᴏᴅᴇ ᴀᴄᴛɪᴠᴇ).\nYou can now type your commands without any prefix (e.g., menu).`;
                return await kaya.sendMessage(from, { 
                    text: successBox(successContent) 
                }, { quoted: mek });
            }

            if (sub === 'off') {
                setSetting(ownerId, 'noPrefix', false);
                const currentPrefix = getSetting(ownerId, 'prefix', '.');
                const successContent = `ᴘʀᴇғɪx ʀᴇsᴛᴏʀᴇᴅ.\nCommands now require the prefix \`${currentPrefix}\` (e.g., \`${currentPrefix}menu\`).`;
                return await kaya.sendMessage(from, { 
                    text: successBox(successContent) 
                }, { quoted: mek });
            }

            return await kaya.sendMessage(from, { 
                text: usageBox(prefix, 'delprefix', '<on|off>') 
            }, { quoted: mek });

        } catch (err) {
            console.error('Error in delprefix.js :', err);
            await kaya.sendMessage(from, { 
                text: errorBox(`ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ : ${err.message}`) 
            }, { quoted: mek });
        }
    }
};
