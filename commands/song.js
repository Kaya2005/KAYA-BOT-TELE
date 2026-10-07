// ==================== commands/song.js ====================

import yts from 'yt-search';
import axios from 'axios';
import { boxMessage, errorBox, usageBox } from '../setting/theme.js';

// Delay helper function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
    name: 'song',
    alias: ['audio', 'play'],
    description: 'Download song from YouTube',
    category: 'Download',

    async execute(kaya, mek, from, args, prefix) {
        try {
            if (!args.length) {
                return await kaya.sendMessage(from, { text: usageBox(prefix, 'song', '<song name or url>') }, { quoted: mek });
            }

            const query = args.join(' ').trim();
            await kaya.sendMessage(from, { react: { text: "🔎", key: mek.key } });

            let video;
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                video = { url: query, title: 'YouTube Video', timestamp: 'N/A', thumbnail: 'https://i.imgur.com/Te54m9u.jpeg' };
            } else {
                const search = await yts(query);
                if (!search.videos.length) {
                    return await kaya.sendMessage(from, { text: errorBox('No results found.') }, { quoted: mek });
                }
                video = search.videos[0];
            }

            // Sending the thumbnail with title, duration, downloading status
            await delay(1000);
            
            const content = 
                `• *Title:* ${video.title}\n` +
                `• *Duration:* ${video.timestamp || "N/A"}\n\n` +
                `⏳ *Downloading audio in progress...*\n` +
                `🔗 *Connect:* t.me/kaya243`;

            const message = boxMessage('YouTube Audio', content, '🎵');

            await kaya.sendMessage(from, {
                image: { url: video.thumbnail },
                caption: message,
            }, { quoted: mek });

            await kaya.sendMessage(from, { react: { text: "⏳", key: mek.key } });

            // Secure API call
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(video.url)}`;
            const response = await axios.get(apiUrl, { timeout: 30000 });
            const data = response.data;

            if (!data?.status || !data.audio) {
                return await kaya.sendMessage(from, { text: errorBox('Failed to retrieve audio from the server.') }, { quoted: mek });
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
            await kaya.sendMessage(from, { text: errorBox('Error processing request. The API might be overloaded.') }, { quoted: mek });
            await kaya.sendMessage(from, { react: { text: "❌", key: mek.key } });
        }
    }
};
