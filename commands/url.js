// ==================== commands/url.js ====================
import axios from 'axios';
import FormData from 'form-data';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { getBotName } from '../setting/botAssets.js';

export default {
  name: 'url',
  description: '🔗 Génère un lien Catbox à partir d’un média',
  category: 'Tools',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const quoted = mek.quoted ? mek.quoted : mek;
      const mime = (quoted.msg || quoted).mimetype || '';

      if (!/image|video|audio|document/.test(mime)) {
        return await kaya.sendMessage(from, {
          text: '📸 *Veuillez répondre à une image, vidéo ou audio.*'
        }, { quoted: mek });
      }

      // Simulation de présence pendant l'upload
      await kaya.sendPresenceUpdate('composing', from);

      // Téléchargement du buffer
      const stream = await downloadContentFromMessage(quoted, mime.split('/')[0]);
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // Préparation du FormData pour Catbox
      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', buffer, {
        filename: `media.${mime.split('/')[1]?.split(';')[0] || 'bin'}`
      });

      // Envoi vers Catbox
      const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: {
          ...form.getHeaders()
        }
      });

      const url = response.data;
      if (!url || url.includes("Error")) throw new Error("API Response invalid");

      const botName = getBotName(mek.sender);
      const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*🔗 MEDIA URL GENERATED*\n\n*➡️ Type:* ${mime.split('/')[0].toUpperCase()}\n*🌐 Link:* ${url}`;

      // Envoi du message texte simple sans image
      return await kaya.sendMessage(from, { text: caption }, { quoted: mek });

    } catch (err) {
      console.error('❌ url.js error:', err);
      return await kaya.sendMessage(from, { 
        text: '❌ Erreur lors de l’upload vers Catbox.'
      }, { quoted: mek });
    }
  }
};
