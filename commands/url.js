// url.js
import axios from 'axios';
import FormData from 'form-data';
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

            const loadingMsg = await kaya.sendMessage(from, { text: '⏳ Uploading...' }, { quoted: mek });
            
            const media = await kaya.downloadMediaMessage(quoted);
            
            let link = '';
            
            // Tentative via Catbox
            try {
                const form = new FormData();
                form.append('reqtype', 'fileupload');
                form.append('fileToUpload', Buffer.from(media), 'media.tmp');
                const res = await axios.post('https://catbox.moe/user/api.php', form, { 
                    headers: form.getHeaders() 
                });
                link = res.data;
            } catch (catboxErr) {
                console.warn('⚠️ Catbox a échoué, tentative via File.io...');
                // Fallback : Utilisation de File.io (plus simple, pas besoin de FormData complexe)
                const res = await axios.post('https://file.io', { file: Buffer.from(media) }, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                link = res.data.link;
            }

            await kaya.sendMessage(from, { delete: loadingMsg.key });
            await kaya.sendMessage(from, { 
                text: `✅ *MÉDIA UPLOADÉ*\n\n🔗 *URL :* ${link}\n\nType: ${mime}`,
                contextInfo: getContextInfo() 
            }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur critique dans url.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ Impossible d\'héberger le fichier, réessayez plus tard.' }, { quoted: mek });
        }
    }
};
