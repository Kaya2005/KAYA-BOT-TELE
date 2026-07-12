import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';
import startpairing from '../pair.js'; 
import fs from 'fs';
import path from 'path';

export default {
  name: 'connect',
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
      const jid = targetNumber + "@s.whatsapp.net";
      const sessionIdentifier = sender.replace(/[^0-9]/g, ''); 

      await kaya.sendMessage(from, { text: '⏳ *Génération en cours...*' }, { quoted: mek });

      // Appel sécurisé
      await startpairing(jid, sessionIdentifier, botName).catch(e => console.error("Erreur startpairing:", e));

      // Attente simplifiée
      const filePath = path.join(pairingFolder, `pairing_${sessionIdentifier}.json`);
      
      let attempts = 0;
      while (attempts < 10) {
        if (fs.existsSync(filePath)) break;
        await new Promise(r => setTimeout(r, 1000));
        attempts++;
      }

      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        await sendWithBotImage(kaya, from, sender, { caption: `✅ Code: ${data.code}`, contextInfo: getContextInfo() });
      } else {
        await kaya.sendMessage(from, { text: '❌ Erreur de génération.' }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ Erreur pair.js:', err);
    }
  }
};
