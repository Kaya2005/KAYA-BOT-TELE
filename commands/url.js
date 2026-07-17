import axios from 'axios';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
    name: 'url',
    description: 'Convertit un média en lien public',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const quoted = mek.quoted ? mek.quoted : mek;
            const mime = (quoted.msg || quoted).mimetype || '';

            if (!/image|video|audio|document/.test(mime)) {
                return kaya.sendMessage(from, { text: '⚠️ Veuillez répondre à un fichier valide.' }, { quoted: mek });
            }

            const loadingMsg = await kaya.sendMessage(from, { text: '⏳ Téléchargement et upload...' }, { quoted: mek });
            
            // 1. Téléchargement sécurisé
            const media = await kaya.downloadMediaMessage(quoted);
            
            // 2. Upload simplifié via une API qui accepte les données binaires directement
            // On utilise 'bashupload.com' qui est beaucoup plus stable pour les bots que Catbox
            const res = await axios.post('https://bashupload.com', media, {
                headers: { 'Content-Type': 'application/octet-stream' }
            });

            const link = res.data.split('\n')[0]; // Récupère l'URL brute

            // 3. Suppression du message de chargement et envoi du lien
            await kaya.sendMessage(from, { delete: loadingMsg.key });
            await kaya.sendMessage(from, { 
                text: `✅ *MÉDIA UPLOADÉ*\n\n🔗 *URL :* ${link}\n\nType: ${mime}`,
                contextInfo: getContextInfo() 
            }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur url.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ Erreur technique. Le bot est peut-être en cours de synchronisation. Réessayez.' }, { quoted: mek });
        }
    }
};
