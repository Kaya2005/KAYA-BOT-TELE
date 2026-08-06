// ==================== getStatus.js ====================
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { getBotName } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
    name: 'getStatus',
    alias: ['savestatus', 'fetchstatus'],
    description: 'Downloads and saves a WhatsApp status or story by replying to it.',
    category: 'Media',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Nettoyage sécurisé de l'ID du bot (ex: 243...)
            const botId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
            if (!botId) {
                return await kaya.sendMessage(from, { text: "❌ Error: Unable to retrieve bot ID." }, { quoted: mek });
            }

            const botName = getBotName(botId);
            const quoted = mek.quoted;

            if (!quoted) {
                return await kaya.sendMessage(from, { 
                    text: `❌ Please reply to a **status** (image or video) with the command:\n*${prefix}getStatus*` 
                }, { quoted: mek });
            }

            const mtype = quoted.mtype || quoted.type;
            const isImage = mtype === 'imageMessage';
            const isVideo = mtype === 'videoMessage';
            const isText = mtype === 'conversation' || mtype === 'extendedTextMessage';

            if (isText) {
                const textContent = quoted.text || quoted.caption || "Empty text status";
                const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n💬 *FETCHED TEXT STATUS*\n\n${textContent}`;
                return await kaya.sendMessage(from, { 
                    text: caption,
                    contextInfo: getContextInfo(botId)
                }, { quoted: mek });
            }

            if (!isImage && !isVideo) {
                return await kaya.sendMessage(from, { 
                    text: `❌ The quoted message is neither a valid status image nor video.` 
                }, { quoted: mek });
            }

            await kaya.sendMessage(from, { text: "⏳ Downloading status..." }, { quoted: mek });

            const stream = await downloadMediaMessage(
                { message: { [mtype]: quoted } }, 
                'buffer', 
                {}, 
                { logger: console }
            );

            if (!stream) {
                return await kaya.sendMessage(from, { text: "❌ Failed to download the status." }, { quoted: mek });
            }

            const userCaption = quoted.caption || "";
            const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*✅ STATUS DOWNLOADED*\n${userCaption ? `*💬 Caption:* ${userCaption}` : ''}`.trim();

            if (isImage) {
                await kaya.sendMessage(from, { image: stream, caption: caption, contextInfo: getContextInfo(botId) }, { quoted: mek });
            } else if (isVideo) {
                await kaya.sendMessage(from, { video: stream, caption: caption, contextInfo: getContextInfo(botId) }, { quoted: mek });
            }

        } catch (err) {
            console.error('❌ Error in getStatus.js:', err);
            return await kaya.sendMessage(from, { text: `❌ An error occurred: ${err.message}` }, { quoted: mek });
        }
    }
};
