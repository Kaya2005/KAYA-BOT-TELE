import axios from 'axios';
import { getContextInfo } from '../setting/contextInfo.js';
// Si tu as un fichier config, importe-le ici
// import config from '../config.js'; 

export default {
    name: 'ai',
    aliases: ['gpt', 'ask', 'chatgpt'],
    category: 'ai',
    description: 'Ask the AI anything',
    usage: '.ai <your question>',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const question = args.join(' ');
            
            // 1. Vérification de l'argument
            if (!question) {
                return await kaya.sendMessage(from, { 
                    text: `❌ Please provide a question.\nExample: \`${prefix}ai How to code in Node.js?\`` 
                }, { quoted: mek });
            }

            // 2. Réaction "en cours"
            // Note: Si extra.react n'est pas dispo, utilise: kaya.sendMessage(from, { react: { text: '⏳', key: mek.key }})
            if (typeof extra !== 'undefined' && extra.react) {
                await extra.react('⏳');
            } else {
                await kaya.sendMessage(from, { text: '⏳ *Thinking...*' }, { quoted: mek });
            }

            // 3. Appel API
            const apiUrl = 'https://api.giftedtech.co.ke/api/ai/gpt4o';
            const params = {
                apikey: 'gifted', // Remplace par ta clé API si besoin
                q: question
            };

            const response = await axios.get(apiUrl, { params, timeout: 30000 });

            // 4. Traitement de la réponse
            if (response.data && response.data.success && response.data.result) {
                const answer = response.data.result;
                
                await kaya.sendMessage(from, { 
                    text: answer,
                    contextInfo: getContextInfo() // Ajout de ton contexte personnalisé
                }, { quoted: mek });
            } else {
                await kaya.sendMessage(from, { text: '❌ AI service returned an unexpected response.' }, { quoted: mek });
            }

            // 5. Réaction de fin
            if (typeof extra !== 'undefined' && extra.react) {
                await extra.react('✅');
            }
            
        } catch (error) {
            console.error('AI command error:', error.message);
            
            let errorMsg = '❌ Failed to get a response from AI.';
            if (error.code === 'ECONNABORTED') errorMsg = '❌ Request timed out. Please try again later.';
            else if (error.response) errorMsg = `❌ API error: ${error.response.status}`;
            
            await kaya.sendMessage(from, { text: errorMsg }, { quoted: mek });
            
            // Réaction d'erreur
            if (typeof extra !== 'undefined' && extra.react) {
                await extra.react('❌').catch(() => {});
            }
        }
    }
};
