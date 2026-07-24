// ==================== commands/delprefix.js ====================
import { getSetting, setSetting } from '../setting.js';

export default {
    name: 'delprefix',
    aliases: ['prefixmode', 'noprefix'],
    description: 'Enable or disable prefix requirement',
    category: 'Dev',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user.id.split(':')[0];
            const sub = args[0]?.toLowerCase();

            if (!sub) {
                const currentPrefix = getSetting(ownerId, 'prefix', '.');
                const noPrefix = getSetting(ownerId, 'noPrefix', false);
                
                const helpText = `PREFIX MANAGEMENT

Current Prefix: ${currentPrefix}
No-Prefix Mode: ${noPrefix ? 'ACTIVE' : 'INACTIVE'}

Usage:
delprefix on
delprefix off`;

                return await kaya.sendMessage(from, { text: helpText }, { quoted: mek });
            }

            if (sub === 'on') {
                setSetting(ownerId, 'noPrefix', true);
                return await kaya.sendMessage(from, { 
                    text: `Prefix disabled (No-Prefix mode active).\nYou can now type your commands without any prefix (e.g., menu).` 
                }, { quoted: mek });
            }

            if (sub === 'off') {
                setSetting(ownerId, 'noPrefix', false);
                const currentPrefix = getSetting(ownerId, 'prefix', '.');
                return await kaya.sendMessage(from, { 
                    text: `Prefix restored.\nCommands now require the prefix ${currentPrefix} (e.g., ${currentPrefix}menu).` 
                }, { quoted: mek });
            }

            return await kaya.sendMessage(from, { text: `Invalid option. Type delprefix to view help.` }, { quoted: mek });

        } catch (err) {
            console.error('Error in delprefix.js :', err);
            await kaya.sendMessage(from, { text: `An error occurred: ${err.message}` }, { quoted: mek });
        }
    }
};
