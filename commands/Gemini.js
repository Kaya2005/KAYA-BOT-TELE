// ==================== commands/gemini.js ====================
import axios from 'axios';

export default {
    name: 'gemini',
    aliases: ['geminiai', 'geminichat', 'ai2'],
    description: '💎 Discute avec l’IA Gemini',
    category: 'AI',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const query = args.join(' ');
            if (!query) {
                return await kaya.sendMessage(from, { 
                    text: `❌ Veuillez fournir une question.\n\n*Exemple :* \`${prefix}gemini C'est quoi l'amour ?\`` 
                }, { quoted: mek });
            }

            let result;
            try {
                // Tentative avec la première API
                const baseUrl = 'https://ymd-ai.onrender.com';
                const res = await axios.get(`${baseUrl}/api/gemini`, { params: { q: query }, timeout: 30000 });
                result = res.data?.data;
            } catch (e) {
                // Secours (Fallback) vers l'API Prince si la première échoue
                const baseUrl = 'https://api.princetechn.com/api';
                const apikey = 'prince';
                const res = await axios.get(`${baseUrl}/ai/ai`, { params: { apikey, q: query }, timeout: 30000 });
                result = res.data?.result;
            }

            if (!result) {
                return await kaya.sendMessage(from, { text: '❌ Aucune réponse reçue de l’IA.' }, { quoted: mek });
            }

            const message = `╭═══〘 *GEMINI AI* 〙═══⊷❍
┃✯│ 💬 *Q:* ${query}
┃✯│
┃✯│ ${result}
╰══════════════════⊷❍`;

            await kaya.sendMessage(from, { text: message }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans gemini.js :', err);
            await kaya.sendMessage(from, { text: `⚠️ Une erreur est survenue : ${err.message}` }, { quoted: mek });
        }
    }
};
