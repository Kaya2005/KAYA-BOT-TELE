// ==================== botimage.js ====================
import fs from 'fs';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { getBotName, sendWithBotImage, getLocalBotImagePath } from '../setting/botAssets.js';

export default {
    name: 'botimage',
    alias: ['setbotimage', 'changeimage'],
    description: 'Changes your own bot\'s image by replying to an image',
    category: 'System',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Récupération sécurisée de l'ID du propriétaire du bot
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
            if (!ownerId) {
                return await kaya.sendMessage(from, { text: "❌ *ᴇʀʀᴏʀ : ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʀᴇᴛʀɪᴇᴠᴇ ᴛʜᴇ ᴏᴡɴᴇʀ ɪᴅ.*" }, { quoted: mek });
            }

            const botName = getBotName(ownerId);
            const quoted = mek.quoted;
            const isQuotedImage = quoted && (quoted.mtype === 'imageMessage' || quoted.type === 'imageMessage');

            if (!isQuotedImage) {
                const menuText = `╭─── 🖼️ *ʙᴏᴛ-ɪᴍᴀɢᴇ ᴍᴇɴᴜ* 🖼️ ───╮\n` +
                                 `│\n` +
                                 `│  *ᴅɪʀᴇᴄᴛ ᴄᴏᴍᴍᴀɴᴅs :*\n` +
                                 `│  • \`ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ ᴡɪᴛʜ\`\n` +
                                 `│    \`${prefix}botimage\`\n` +
                                 `│\n` +
                                 `╰────────────────────────╯`;

                return await kaya.sendMessage(from, { text: menuText }, { quoted: mek });
            }

            await kaya.sendMessage(from, { text: "⏳ *ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴀɴᴅ ᴜᴘᴅᴀᴛɪɴɢ ʏᴏᴜʀ ᴄᴜsᴛᴏᴍ ɪᴍᴀɢᴇ...*" }, { quoted: mek });

            const stream = await downloadMediaMessage(
                { message: { imageMessage: quoted } }, 
                'buffer', 
                {}, 
                { logger: console }
            );

            if (!stream) {
                return await kaya.sendMessage(from, { text: "❌ *ғᴀɪʟᴇᴅ ᴛᴏ ᴅᴏᴡɴʟᴏᴀᴅ ᴛʜᴇ ɪᴍᴀɢᴇ.*" }, { quoted: mek });
            }

            // Enregistrement de l'image dans le dossier de l'owner
            const userImagePath = getLocalBotImagePath(ownerId);
            fs.writeFileSync(userImagePath, stream);

            const caption = `╭─── 🖼️ *ɪᴍᴀɢᴇ ᴜᴘᴅᴀᴛᴇᴅ* 🖼️ ───╮\n` +
                            `│\n` +
                            `│  *ʙᴏᴛ :* \`${botName}\`\n` +
                            `│  • *ʏᴏᴜʀ ɴᴇᴡ ʙᴏᴛ ɪᴍᴀɢᴇ ʜᴀs*\n` +
                            `│    *ʙᴇᴇɴ sᴜᴄᴄᴇssғᴜʟʟʏ sᴀᴠᴇᴅ!*\n` +
                            `│\n` +
                            `╰────────────────────────╯`;

            return await sendWithBotImage(kaya, from, ownerId, { caption });

        } catch (err) {
            console.error('❌ botimage.js error:', err);
            return await kaya.sendMessage(from, { text: `❌ *ᴜɴᴇxᴘᴇᴄᴛᴇᴅ ᴇʀʀᴏʀ :* ${err.message}` }, { quoted: mek });
        }
    }
};
