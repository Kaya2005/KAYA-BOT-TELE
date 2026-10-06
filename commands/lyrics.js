import yts from 'yt-search';
import axios from 'axios';

// Ajout d'une fonction de délai
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
    name: 'lyrics',
    description: 'Download song from YouTube',
    category: 'Download',

    async execute(kaya, mek, from, args, prefix) {
        try {
            if (!args.length) {
                return await kaya.sendMessage(from, { text: `❌ Usage: \`${prefix}song <nom de la musique>\`` }, { quoted: mek });
            }

            const query = args.join(' ').trim();
            await kaya.sendMessage(from, { react: { text: "🔎", key: mek.key } });

            let video;
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                video = { url: query, title: 'YouTube Video' };
            } else {
                const search = await yts(query);
                if (!search.videos.length) {
                    await kaya.sendMessage(from, { text: `❌ Aucun résultat trouvé.` }, { quoted: mek });
                    return;
                }
                video = search.videos[0];
            }

            // Envoi de la miniature avec délai
            await delay(1000);
            await kaya.sendMessage(from, {
                image: { url: video.thumbnail },
                caption: `🎵 *${video.title}*\n⏱ ${video.timestamp || "N/A"}\n\n⏳ Téléchargement en cours...`,
            }, { quoted: mek });

            await kaya.sendMessage(from, { react: { text: "⏳", key: mek.key } });

            // Appel API sécurisé
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(video.url)}`;
            const response = await axios.get(apiUrl, { timeout: 30000 }); // Timeout réduit à 30s
            const data = response.data;

            if (!data?.status || !data.audio) {
                return await kaya.sendMessage(from, { text: "❌ Échec de la récupération audio." }, { quoted: mek });
            }

            // Envoi audio avec un court délai pour la stabilité
            await delay(1500);
            await kaya.sendMessage(from, {
                audio: { url: data.audio },
                mimetype: "audio/mpeg",
                fileName: `${data.title.replace(/[^a-zA-Z0-9-_\.]/g, "_")}.mp3`,
            }, { quoted: mek });

            await kaya.sendMessage(from, { react: { text: "✅", key: mek.key } });

        } catch (error) {
            console.error("❌ SONG ERROR:", error);
            // On évite d'envoyer trop de messages d'erreur si l'API est down
            await kaya.sendMessage(from, { text: "❌ Erreur lors du traitement. L'API est peut-être surchargée." }, { quoted: mek });
            await kaya.sendMessage(from, { react: { text: "❌", key: mek.key } });
        }
    }
};
