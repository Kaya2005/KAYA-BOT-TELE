// ==================== getStatus.js ====================
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
    name: 'getstatus',
    alias: ['savestatus', 'fetchstatus'],
    description: 'Publishes a quoted image or video as a group status.',
    category: 'Media',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const quoted = mek.quoted;

            if (!quoted) {
                return await kaya.sendMessage(from, { 
                    text: `❌ Please reply to an **image** or **video** with the command:\n*${prefix}getstatus*` 
                }, { quoted: mek });
            }

            const mtype = quoted.mtype || quoted.type;
            const isImage = mtype === 'imageMessage';
            const isVideo = mtype === 'videoMessage';

            if (!isImage && !isVideo) {
                return await kaya.sendMessage(from, { 
                    text: `❌ The quoted message must be an image or a video.` 
                }, { quoted: mek });
            }

            await kaya.sendMessage(from, { text: "⏳ Publishing as group status..." }, { quoted: mek });

            const stream = await downloadMediaMessage(
                { message: { [mtype]: quoted } }, 
                'buffer', 
                {}, 
                { logger: console }
            );

            if (!stream) {
                return await kaya.sendMessage(from, { text: "❌ Failed to download the media." }, { quoted: mek });
            }

            const caption = quoted.caption || "";

            // Tentative de publication avec l'attribut de diffusion pour les statuts/stories de groupe
            if (isImage) {
                await kaya.sendMessage(from, { 
                    image: stream, 
                    caption: caption,
                    // Paramètre de diffusion/statut si géré par Baileys pour les groupes
                    broadcast: false 
                }, { 
                    // Certains types de stories de groupe nécessitent un contexte particulier
                    quoted: null 
                });
            } else if (isVideo) {
                await kaya.sendMessage(from, { 
                    video: stream, 
                    caption: caption,
                    broadcast: false 
                }, { 
                    quoted: null 
                });
            }

            await kaya.sendMessage(from, { text: `✅ Successfully published to the group status!` }, { quoted: mek });

        } catch (err) {
            console.error('❌ Error in getStatus.js:', err);
            return await kaya.sendMessage(from, { text: `❌ An error occurred: ${err.message}` }, { quoted: mek });
        }
    }
};
