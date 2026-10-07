import fetch from 'node-fetch';

export default {
  name: 'traduc',
  alias: ['trt', 'tr'],
  category: 'AI',
  description: 'Traduit un message en une langue spécifique',
  usage: '.traduc <langue> (en répondant) ou .traduc <texte> <langue>',

  async execute(kaya, mek, from, args) {
    try {
      // 1. Détection du texte (Réponse ou Argument)
      let textToTranslate = '';
      let lang = '';

      const isQuoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const quotedMsg = mek.message?.extendedTextMessage?.contextInfo;

      if (isQuoted) {
        // Extraction du texte du message cité
        const msg = quotedMsg.quotedMessage;
        textToTranslate = msg.conversation || 
                          msg.extendedTextMessage?.text || 
                          msg.imageMessage?.caption || 
                          msg.videoMessage?.caption || '';
        lang = args[0]?.toLowerCase();
      } else {
        // Mode direct : .traduc <texte> <langue>
        if (args.length < 2) {
          return await kaya.sendMessage(from, { 
            text: '❌ Usage: .traduc hello fr (ou réponds à un message avec .traduc fr)' 
          }, { quoted: mek });
        }
        lang = args.pop().toLowerCase();
        textToTranslate = args.join(' ');
      }

      if (!textToTranslate || !lang) {
        return await kaya.sendMessage(from, { text: '❌ Texte ou langue manquante.' }, { quoted: mek });
      }

      // 2. Traduction via Google Translate (Client gtx)
      let translatedText = '';
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data && data[0]) {
        translatedText = data[0].map(item => item[0]).join('');
      }

      if (!translatedText) {
        return await kaya.sendMessage(from, { text: '❌ Traduction impossible.' }, { quoted: mek });
      }

      // 3. Envoi
      await kaya.sendMessage(from, { text: `🌍 *Traduction (${lang.toUpperCase()}):*\n\n${translatedText}` }, { quoted: mek });

    } catch (err) {
      console.error('❌ Traduc error:', err);
      await kaya.sendMessage(from, { text: '❌ Erreur lors de la traduction.' }, { quoted: mek });
    }
  }
};
