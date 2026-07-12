import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';
import fs from 'fs';
import path from 'path';

export default {
  name: 'pair',
  description: '🔗 Connectez votre compte WhatsApp au bot',
  category: 'General',
  usage: '.pair <numéro>',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);
      const pairingFolder = './richstore/pairing';

      if (!args[0]) {
        return await sendWithBotImage(kaya, from, sender, { 
            caption: `*AIDE PAIRAGE*\nUsage: ${prefix}pair 243xxxxxxxxx`,
            contextInfo: getContextInfo() 
        });
      }

      const targetNumber = args[0].replace(/[^0-9]/g, '');
      const sessionIdentifier = sender.replace(/[^0-9]/g, ''); 

      // On crée un fichier de signalement au lieu de lancer la fonction directement
      const requestFile = path.join(pairingFolder, `request_${sessionIdentifier}.json`);
      fs.writeFileSync(requestFile, JSON.stringify({ jid: targetNumber + "@s.whatsapp.net", name: botName }));

      await kaya.sendMessage(from, { text: '⏳ *Demande de pairage enregistrée. Le système va générer le code sous peu...*' }, { quoted: mek });

    } catch (err) {
      console.error('❌ Erreur pair.js:', err);
      await kaya.sendMessage(from, { text: '❌ Une erreur est survenue.' }, { quoted: mek });
    }
  }
};
