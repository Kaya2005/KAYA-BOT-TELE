import { getSetting, setSetting } from '../setting.js';
import { boxMessage, errorBox, usageBox } from '../setting/theme.js';

export default {
    name: 'sudo',
    alias: ['setsudo', 'addsudo', 'delsudo'],
    description: 'Grants or revokes Sudo privileges for a user',
    category: 'Owner',
    ownerOnly: true, // Only the actual owner can manage Sudo users

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user.id.split(':')[0];
            const action = args[0]?.toLowerCase();
            
            // Retrieves the target user (via reply, mention, or number)
            let targetUser = mek.quoted?.sender || mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!targetUser && args[1]) {
                targetUser = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            }

            // If no valid argument, displays the sudo menu
            if (!['add', 'del', 'list'].includes(action)) {
                const sudoList = getSetting(ownerId, 'sudo_list', []);
                const listText = sudoList.length > 0 
                    ? sudoList.map(j => `• @${j.split('@')[0]}`).join('\n') 
                    : 'No registered Sudo users.';
                
                const content = `${listText}\n\n*Usage:*\n• ${prefix}sudo add @user\n• ${prefix}sudo del @user\n• ${prefix}sudo list`;
                const message = boxMessage('Sudo Management', content, '👑');

                return await kaya.sendMessage(from, { 
                    text: message,
                    mentions: sudoList
                }, { quoted: mek });
            }

            if (action === 'list') {
                const sudoList = getSetting(ownerId, 'sudo_list', []);
                const listText = sudoList.length > 0 
                    ? sudoList.map(j => `• @${j.split('@')[0]}`).join('\n') 
                    : 'No registered Sudo users.';
                
                const message = boxMessage('Sudo Users List', listText, '👑');
                return await kaya.sendMessage(from, { text: message, mentions: sudoList }, { quoted: mek });
            }

            if (!targetUser) {
                return await kaya.sendMessage(from, { text: usageBox(prefix, 'sudo add/del', '@user or reply to message') }, { quoted: mek });
            }

            let sudoList = getSetting(ownerId, 'sudo_list', []);

            if (action === 'add') {
                if (sudoList.includes(targetUser)) {
                    return await kaya.sendMessage(from, { text: errorBox('This user already has Sudo privileges.') }, { quoted: mek });
                }
                sudoList.push(targetUser);
                await setSetting(ownerId, 'sudo_list', sudoList);

                const successContent = `User @${targetUser.split('@')[0]} successfully promoted to Sudo rank!`;
                const message = boxMessage('Sudo Added', successContent, '✅');
                return await kaya.sendMessage(from, { text: message, mentions: [targetUser] }, { quoted: mek });
            }

            if (action === 'del') {
                if (!sudoList.includes(targetUser)) {
                    return await kaya.sendMessage(from, { text: errorBox('This user is not in the Sudo list.') }, { quoted: mek });
                }
                sudoList = sudoList.filter(j => j !== targetUser);
                await setSetting(ownerId, 'sudo_list', sudoList);

                const successContent = `Sudo privileges revoked for @${targetUser.split('@')[0]}.`;
                const message = boxMessage('Sudo Removed', successContent, '✅');
                return await kaya.sendMessage(from, { text: message, mentions: [targetUser] }, { quoted: mek });
            }

        } catch (err) {
            console.error('❌ Sudo command error:', err);
            return await kaya.sendMessage(from, { text: errorBox(`An error occurred: ${err.message}`) }, { quoted: mek });
        }
    }
};
