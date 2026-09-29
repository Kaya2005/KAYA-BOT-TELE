// ==========================================
// FICHIER : commandtele/song.js (Corrigé)
// ==========================================
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yts from 'yt-search';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const langFilePath = path.join(__dirname, '../database/languages.json');

function getLang(chatId) {
    try {
        if (fs.existsSync(langFilePath)) {
            const data = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
            return data[String(chatId)] || 'en';
        }
    } catch (e) {}
    return 'en';
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function setupSong(bot) {
    bot.command('song', async (ctx) => {
        try {
            const chatId = ctx.chat.id;
            const lng = getLang(chatId);
            const query = ctx.message.text.replace(/^\/song(?:@\w+)?/i, '').trim();

            if (!query) {
                const usageText = lng === 'fr'
                    ? "<blockquote>⚠️ Veuillez spécifier le titre de la chanson.\nExemple : <code>/song Fally Ipupa</code></blockquote>"
                    : "<blockquote>⚠️ Please specify the song title.\nExample: <code>/song Fally Ipupa</code></blockquote>";
                return ctx.reply(usageText, { parse_mode: 'HTML', reply_to_message_id: ctx.message?.message_id });
            }

            const searchingText = lng === 'fr'
                ? "<blockquote>⏳ Recherche et téléchargement en cours...</blockquote>"
                : "<blockquote>⏳ Searching and downloading in progress...</blockquote>";
            
            const sentMsg = await ctx.reply(searchingText, { parse_mode: 'HTML', reply_to_message_id: ctx.message?.message_id });

            let video;
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                video = { url: query, title: 'YouTube Video' };
            } else {
                const search = await yts(query);
                if (!search.videos.length) {
                    try { await ctx.telegram.deleteMessage(chatId, sentMsg.message_id); } catch (e) {}
                    const noResText = lng === 'fr' ? "<blockquote>❌ Aucun résultat trouvé.</blockquote>" : "<blockquote>❌ No results found.</blockquote>";
                    return ctx.reply(noResText, { parse_mode: 'HTML', reply_to_message_id: ctx.message?.message_id });
                }
                video = search.videos[0];
            }

            // Appel sécurisé avec votre API Cloudflare Worker (identique à WhatsApp)
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(video.url)}`;
            const response = await axios.get(apiUrl, { timeout: 30000 });
            const data = response.data;

            // Supprimer le message d'attente
            try { await ctx.telegram.deleteMessage(chatId, sentMsg.message_id); } catch (e) {}

            if (data && data.audio) {
                await delay(1000);
                await ctx.replyWithAudio(data.audio, {
                    caption: `<blockquote>🎵 <b>${video.title || query}</b></blockquote>`,
                    parse_mode: 'HTML',
                    reply_to_message_id: ctx.message?.message_id
                });
            } else {
                await ctx.reply("<blockquote>❌ Erreur lors de la récupération du fichier audio.</blockquote>", { parse_mode: 'HTML' });
            }

        } catch (err) {
            console.error('[SONG ERROR]:', err);
            await ctx.reply("<blockquote>❌ Une erreur est survenue lors du traitement de votre demande.</blockquote>", { parse_mode: 'HTML' }).catch(() => {});
        }
    });
}
