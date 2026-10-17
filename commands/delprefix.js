// ==================== commands/delprefix.js ====================
import { getSetting, setSetting } from '../setting.js';
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';
import { getString } from '../setting/language.js';

export default {
    name: 'delprefix',
    aliases: ['prefixmode', 'noprefix'],
    description: 'Enable or disable prefix requirement',
    category: 'System',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            const rawSub = args[0]?.toLowerCase();

            // 🔄 MAPPING DES SOUS-COMMANDES SELON LA LANGUE (FR/EN)
            const subMap = {
                "on": "on",
                "oui": "on",
                "yes": "on",
                "1": "on",

                "off": "off",
                "non": "off",
                "no": "off",
                "0": "off"
            };

            const sub = subMap[rawSub];

            if (!rawSub) {
                const currentPrefix = getSetting(ownerId, 'prefix', '.');
                const noPrefix = getSetting(ownerId, 'noPrefix', false);
                
                const menuContent = 
                    `• *${getString(ownerId, 'delPrefixCurrentLabel')} :* \`${currentPrefix}\`\n` +
                    `• *${getString(ownerId, 'delPrefixModeLabel')} :*${noPrefix ? getString(ownerId, 'mode_on') : getString(ownerId, 'mode_off')}\n\n` +
                    `• \`${prefix}delprefix on / oui\`\n` +
                    `• \`${prefix}delprefix off / non\``;

                return await kaya.sendMessage(from, { 
                    text: boxMessage(getString(ownerId, 'delPrefixMenuTitle'), menuContent, '⚙️') 
                }, { quoted: mek });
            }

            if (sub === 'on') {
                setSetting(ownerId, 'noPrefix', true);
                const successContent = `${getString(ownerId, 'delPrefixEnabledMsg')}\n${getString(ownerId, 'delPrefixEnabledSub')}`;
                return await kaya.sendMessage(from, { 
                    text: successBox(successContent) 
                }, { quoted: mek });
            }

            if (sub === 'off') {
                setSetting(ownerId, 'noPrefix', false);
                const currentPrefix = getSetting(ownerId, 'prefix', '.');
                const successContent = `${getString(ownerId, 'delPrefixDisabledMsg')}\n${getString(ownerId, 'delPrefixDisabledSub').replace('{prefix}', currentPrefix)}`;
                return await kaya.sendMessage(from, { 
                    text: successBox(successContent) 
                }, { quoted: mek });
            }

            return await kaya.sendMessage(from, { 
                text: usageBox(prefix, 'delprefix', '<on|off>') 
            }, { quoted: mek });

        } catch (err) {
            console.error('Error in delprefix.js :', err);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            await kaya.sendMessage(from, { 
                text: errorBox(`${getString(ownerId, 'delPrefixError')} : ${err.message}`) 
            }, { quoted: mek });
        }
    }
};
