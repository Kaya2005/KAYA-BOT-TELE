// ================= commands/song.js =================
import yts from 'yt-search';
import axios from 'axios';

export default {
    name: 'song',
    description: 'Download song from YouTube',
    category: 'Download',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // -------------------- Vérification de la requête --------------------
            if (!args.length) {
                await kaya.sendMessage(
                    from,
                    { text: `❌ Usage: \`${prefix}song <nom de la musique>\`` },
                    { quoted: mek }
                );
                await kaya.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return;
            }

            const query = args.join(' ').trim();

            // 🔎 Réaction de recherche
            await kaya.sendMessage(from, { react: { text: "🔎", key: mek.key } });

            // -------------------- Recherche YouTube --------------------
            let video;

            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                video = { url: query, title: query };
            } else {
                const search = await yts(query);

                if (!search.videos.length) {
                    await kaya.sendMessage(
                        from,
                        { text: `❌ Aucun résultat trouvé pour votre recherche !` },
                        { quoted: mek }
                    );
                    await kaya.sendMessage(from, { react: { text: "⚠️", key: mek.key } });
                    return;
                }

                video = search.videos[0];
            }

            // -------------------- Message d'info --------------------
            await kaya.sendMessage(from, {
                image: { url: video.thumbnail },
                caption: `🎵 *${video.title}*\n⏱ ${video.timestamp || "N/A"}\n\n⏳ Téléchargement en cours...`,
            }, { quoted: mek });

            // ⏳ Réaction de téléchargement
            await kaya.sendMessage(from, { react: { text: "⏳", key: mek.key } });

            // -------------------- Appel API --------------------
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(video.url)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });
            const data = response.data;

            if (!data?.status || !data.audio) {
                await kaya.sendMessage(
                    from,
                    { text: "❌ Échec de la récupération API. Veuillez réessayer plus tard." },
                    { quoted: mek }
                );
                await kaya.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return;
            }

            const audioUrl = data.audio;
            const title = data.title || video.title;

            // -------------------- Envoi audio --------------------
            await kaya.sendMessage(from, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${title.replace(/[^a-zA-Z0-9-_\.]/g, "_")}.mp3`,
            }, { quoted: mek });

            // ✅ Réaction de succès
            await kaya.sendMessage(from, { react: { text: "✅", key: mek.key } });

        } catch (error) {
            console.error("❌ SONG ERROR:", error);

            let errorMessage = "❌ Échec du téléchargement. Veuillez réessayer plus tard.";

            if (error.code === "ENOTFOUND") {
                errorMessage = "❌ Erreur réseau. Vérifiez votre connexion.";
            } else if (error.response?.status === 404) {
                errorMessage = "❌ Musique introuvable ou indisponible.";
            } else if (error.response?.status === 429) {
                errorMessage = "❌ Trop de requêtes. Veuillez patienter un instant.";
            }

            await kaya.sendMessage(from, { text: errorMessage }, { quoted: mek });
            await kaya.sendMessage(from, { react: { text: "❌", key: mek.key } });
        }
    }
};