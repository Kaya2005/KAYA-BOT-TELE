// ==================== commands/song.js ====================

import yts from 'yt-search';
import axios from 'axios';
import { BOT_SLOGAN } from '../setting/botAssets.js';

// Delay helper function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
    name: 'song',
    description: 'Download song from YouTube',
    category: 'Download',

    async execute(kaya, mek, from, args, prefix) {
        try {
            if (!args.length) {
                const helpText = 
                    `╭─── 🎵 *sᴏɴɢ ʜᴇʟᴘ* ───╮\n` +
                    `│\n` +
                    `│  *ᴜsᴀɢᴇ :*\n` +
                    `│  • \`${prefix}song <song name>\`\n` +
                    `│\n` +
                    `╰──────────────────────╯`;
                return await kaya.sendMessage(from, { text: helpText }, { quoted: mek });
            }

            const query = args.join(' ').trim();
            await kaya.sendMessage(from, { react: { text: "🔎", key: mek.key } });

            let video;
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                video = { url: query, title: 'YouTube Video' };
            } else {
                const search = await yts(query);
                if (!search.videos.length) {
                    await kaya.sendMessage(from, { text: '╭─── ❌ *ᴇʀʀᴏʀ* ───╮\n│\n│  ɴᴏ ʀᴇsᴜʟᴛs ғᴏᴜɴᴅ.\n│\n╰──────────────────╯' }, { quoted: mek });
                    return;
                }
                video = search.videos[0];
            }

            // Sending the thumbnail with title, duration, downloading status, channel link, and signature
            await delay(1000);
            
            const caption = 
                `╭─── 🎵 *ʏᴏᴜᴛᴜʙᴇ sᴏɴɢ* ───╮\n` +
                `│\n` +
                `│  *ᴛɪᴛʟᴇ :* ${video.title}\n` +
                `│  *ᴅᴜʀᴀᴛɪᴏɴ :* ${video.timestamp || "N/A"}\n` +
                `│\n` +
                `│  ⏳ *ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ɪɴ ᴘʀᴏɢʀᴇss...*\n` +
                `│  🔗 *ʙᴏᴛ ʟɪɴᴋ :* ᴛ.ᴍᴇ/ᴋᴀʏᴀ243\n` +
                `│\n` +
                `╰──────────────────────────╯\n\n` +
                `${BOT_SLOGAN}`;

            await kaya.sendMessage(from, {
                image: { url: video.thumbnail },
                caption: caption,
            }, { quoted: mek });

            await kaya.sendMessage(from, { react: { text: "⏳", key: mek.key } });

            // Secure API call
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(video.url)}`;
            const response = await axios.get(apiUrl, { timeout: 30000 });
            const data = response.data;

            if (!data?.status || !data.audio) {
                return await kaya.sendMessage(from, { text: '╭─── ❌ *ᴇʀʀᴏʀ* ───╮\n│\n│  ғᴀɪʟᴇᴅ ᴛᴏ ʀᴇᴛʀɪᴇᴠᴇ ᴀᴜᴅɪᴏ.\n│\n╰──────────────────╯' }, { quoted: mek });
            }

            // Sending audio with a short delay for stability
            await delay(1500);
            await kaya.sendMessage(from, {
                audio: { url: data.audio },
                mimetype: "audio/mpeg",
                fileName: `${data.title.replace(/[^a-zA-Z0-9-_\.]/g, "_")}.mp3`,
            }, { quoted: mek });

            await kaya.sendMessage(from, { react: { text: "✅", key: mek.key } });

        } catch (error) {
            console.error("❌ SONG ERROR:", error);
            await kaya.sendMessage(from, { text: '╭─── ❌ *ᴇʀʀᴏʀ* ───╮\n│\n│  ᴇʀʀᴏʀ ᴘʀᴏᴄᴇssɪɴɢ ʀᴇǫᴜᴇsᴛ.\n│  ᴛʜᴇ ᴀᴘɪ ᴍɪɢʜᴛ ʙᴇ ᴏᴠᴇʀʟᴏᴀᴅᴇᴅ.\n│\n╰──────────────────╯' }, { quoted: mek });
            await kaya.sendMessage(from, { react: { text: "❌", key: mek.key } });
        }
    }
};
