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
                return await kaya.sendMessage(from, { text: `❌ Usage: \`${prefix}song <song name>\`` }, { quoted: mek });
            }

            const query = args.join(' ').trim();
            await kaya.sendMessage(from, { react: { text: "🔎", key: mek.key } });

            let video;
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                video = { url: query, title: 'YouTube Video' };
            } else {
                const search = await yts(query);
                if (!search.videos.length) {
                    await kaya.sendMessage(from, { text: `❌ No results found.` }, { quoted: mek });
                    return;
                }
                video = search.videos[0];
            }

            // Sending the thumbnail with title, duration, downloading status, channel link, and imported signature
            await delay(1000);
            await kaya.sendMessage(from, {
                image: { url: video.thumbnail },
                caption: `🎵 *${video.title}*
⏱ ${video.timestamp || "N/A"}

⏳ Downloading in progress...

bot link : https://t.me/kayatech2

${BOT_SLOGAN}`,
            }, { quoted: mek });

            await kaya.sendMessage(from, { react: { text: "⏳", key: mek.key } });

            // Secure API call
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(video.url)}`;
            const response = await axios.get(apiUrl, { timeout: 30000 }); // Timeout reduced to 30s
            const data = response.data;

            if (!data?.status || !data.audio) {
                return await kaya.sendMessage(from, { text: `❌ Failed to retrieve audio.` }, { quoted: mek });
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
            await kaya.sendMessage(from, { text: `❌ Error processing request. The API might be overloaded.` }, { quoted: mek });
            await kaya.sendMessage(from, { react: { text: "❌", key: mek.key } });
        }
    }
};
