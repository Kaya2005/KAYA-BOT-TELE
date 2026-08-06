// ==================== getStatus.js ====================
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
    name: 'getstatus',
    alias: ['savestatus', 'fetchstatus'],
    description: 'Downloads and saves a WhatsApp status or story by replying to it.',
    category: 'Group',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const quoted = mek.quoted;

            if (!quoted) {
                return await kaya.sendMessage(from, { 
                    text: `❌ Please reply to a **status** (image or video) with the command:\n*${prefix}getstatus*` 
                }, { quoted: mek });
            }

            const mtype = quoted.mtype || quoted.type;
            const isImage = mtype === 'imageMessage';
            const isVideo = mtype === 'videoMessage';
            const isText = mtype === 'conversation' || mtype === 'extendedTextMessage';

            if (isText) {
                const textContent = quoted.text || quoted.caption || "Empty text status";
                return await kaya.sendMessage(from, { 
                    text: `💬 *Fetched text status:*\n\n${textContent}` 
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

            const caption = quoted.caption || "";

            if (isImage) {
                await kaya.sendMessage(from, { image: stream, caption: caption }, { quoted: mek });
            } else if (isVideo) {
                await kaya.sendMessage(from, { video: stream, caption: caption }, { quoted: mek });
            }

        } catch (err) {
            console.error('❌ Error in getStatus.js:', err);
            return await kaya.sendMessage(from, { text: `❌ An error occurred: ${err.message}` }, { quoted: mek });
        }
    }
};
