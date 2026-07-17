// url.js
import axios from 'axios';
import FormData from 'form-data';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
    name: 'url',
    description: 'Convertit une image/vidéo en lien public (Catbox)',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const quoted = mek.quoted ? mek.quoted : mek;
            const mime = (quoted.msg || quoted).mimetype || '';

            if (!/image|video|audio/.test(mime)) {
                return kaya.sendMessage(from, { 
                    text: '⚠️ Veuillez répondre à une image, une vidéo ou un audio pour obtenir son lien.' 
                }, { quoted: mek });
            }

            const loadingMsg = await kaya.sendMessage(from, { text: '⏳ Uploading...' }, { quoted: mek });
            
            // Téléchargement du média
            const media = await kaya.downloadMediaMessage(quoted);
            
            // Préparation de l'upload vers Catbox
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', Buffer.from(media), 'media.tmp');

            const res = await axios.post('https://catbox.moe/user/api.php', form, { 
                headers: form.getHeaders() 
            });

            const link = res.data;

            // Suppression du message de chargement et envoi du lien
            await kaya.sendMessage(from, { delete: loadingMsg.key });
            await kaya.sendMessage(from, { 
                text: `✅ *MÉDIA UPLOADÉ*\n\n🔗 *URL :* ${link}\n\nType: ${mime}`,
                contextInfo: getContextInfo() 
            }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans url.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ Une erreur est survenue lors de l\'upload.' }, { quoted: mek });
        }
    }
};
