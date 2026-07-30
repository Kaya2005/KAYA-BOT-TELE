// ==================== commands/ai.js ====================
import fetch from 'node-fetch';

export default {
    name: 'ai',
    description: '🤖 Pose une question à l\'intelligence artificielle',
    category: 'IA',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const text = args.join(' ').trim();

            if (!text) {
                return await kaya.sendMessage(from, { 
                    text: `*❌ Utilisation incorrecte.*\n\nExemple : \`${prefix}ai C'est quoi Node.js ?\`` 
                }, { quoted: mek });
            }

            // Message de chargement / attente
            await kaya.sendMessage(from, { 
                text: '⏳ *Réflexion en cours...* 🤖' 
            }, { quoted: mek });

            // Appel à l'API Gemini / AI
            const apiResponse = await fetch(`https://apis.davidcyriltech.my.id/ai/gemini?text=${encodeURIComponent(text)}`);
            const json = await apiResponse.json();

            const answer = json.result || json.message || json.answer || "Désolé, aucune réponse n'a été retournée par l'IA.";

            const message = `🤖 *KAYA AI ASSISTANT*\n\n${answer}`;

            await kaya.sendMessage(from, { text: message }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans ai.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ Une erreur est survenue lors de la communication avec l’intelligence artificielle.' }, { quoted: mek });
        }
    }
};
