// ==================== commands/imagine.js ====================
import axios from 'axios';

export default {
    name: 'imagine',
    aliases: ['imagegen', 'genimg', 'ai7'],
    description: '🎨 Génère une image à partir d’un texte',
    category: 'AI',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const prompt = args.join(' ');
            if (!prompt) {
                return await kaya.sendMessage(from, { 
                    text: `❌ Veuillez fournir une description pour l'image.\n\n*Exemple :* \`${prefix}imagine un magnifique coucher de soleil\`` 
                }, { quoted: mek });
            }

            // Message d'attente
            await kaya.sendMessage(from, { text: '⏳ Génération de l’image en cours...' }, { quoted: mek });

            // Appel API
            const baseUrl = 'https://api.dreaded.site/api/imagine';
            const res = await axios.get(baseUrl, { params: { text: prompt }, timeout: 30000 });
            const imageUrl = res.data?.result;

            if (!imageUrl) {
                return await kaya.sendMessage(from, { text: '❌ Échec de la génération de l’image.' }, { quoted: mek });
            }

            // Envoi de l'image générée avec ton design
            await kaya.sendMessage(from, {
                image: { url: imageUrl },
                caption: `╭═══〘 *AI IMAGE* 〙═══⊷❍
┃✯│ 🎨 *Prompt:* ${prompt}
╰══════════════════⊷❍`
            }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans imagine.js :', err);
            await kaya.sendMessage(from, { text: `⚠️ Une erreur est survenue : ${err.message}` }, { quoted: mek });
        }
    }
};
