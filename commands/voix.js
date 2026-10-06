import { getBotName } from '../setting/botAssets.js';
import { getAudioBuffer } from '../lib/tts.js';

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

      const cleanText = text.slice(0, 200);

      // Génération directe du buffer audio
      const buffer = await getAudioBuffer(cleanText, 'fr');

      return await kaya.sendMessage(from, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        ptt: true
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ voice.js error:', err);
      return await kaya.sendMessage(from, { 
        text: '❌ Failed to generate voice.' 
      }, { quoted: mek });
    }
  }
};
