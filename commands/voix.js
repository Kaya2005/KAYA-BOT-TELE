// ==================== commands/voice.js ====================
import { getBotName } from '../setting/botAssets.js';
import { getAudioUrl } from '../lib/tts.js';
import axios from 'axios';

export default {
  name: 'voice',
  description: '🎤 Converts text into a voice message',
  category: 'General',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);
      const text = args.join(' ');

      if (!text) {
        const textCaption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*❌ NO TEXT PROVIDED*\n*Usage:* \`${prefix}voice <text>\``.trim();
        return await kaya.sendMessage(from, { text: textCaption }, { quoted: mek });
      }

      // Limite de caractères pour éviter les erreurs d'URL
      const cleanText = text.slice(0, 200);

      // Génération de l'URL
      const audioUrl = getAudioUrl(cleanText, { lang: 'fr' });

      // Téléchargement avec un User-Agent pour éviter le blocage de l'API
      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const buffer = Buffer.from(response.data);

      // Envoi en tant que note vocale
      return await kaya.sendMessage(from, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        ptt: true
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ voice.js error:', err.message);
      return await kaya.sendMessage(from, { 
        text: '❌ Failed to generate voice. The API might be down or the text is invalid.' 
      }, { quoted: mek });
    }
  }
};
