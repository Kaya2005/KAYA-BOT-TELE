import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';
import fs from 'fs';
import path from 'path';

// Fonction de délai utilitaire
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  name: 'pair',
  description: '🔗 Link your WhatsApp account to the bot',
  category: 'General',
  usage: '.pair <number>',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const pairingFolder = './richstore/pairing';
      
      // Sécurité : Vérifier l'existence du dossier
      if (!fs.existsSync(pairingFolder)) fs.mkdirSync(pairingFolder, { recursive: true });

      if (!args[0]) {
        return await sendWithBotImage(kaya, from, sender, { 
            caption: `*PAIRING HELP* 🔗\n\nUsage: \`${prefix}pair 243xxxxxxxxx\``,
            contextInfo: getContextInfo() 
        });
      }

      const targetNumber = args[0].replace(/[^0-9]/g, '');
      const sessionIdentifier = targetNumber; 

      const waitMsg = await kaya.sendMessage(from, { text: '⏳ *Generating pairing code...*' }, { quoted: mek });

      const requestFile = path.join(pairingFolder, `request_${sessionIdentifier}.json`);
      const codeFilePath = path.join(pairingFolder, `pairing_${sessionIdentifier}.json`);

      // Nettoyage préalable (si une ancienne demande existe encore)
      if (fs.existsSync(codeFilePath)) fs.unlinkSync(codeFilePath);

      // 2. Création de la requête
      fs.writeFileSync(requestFile, JSON.stringify({ jid: targetNumber + "@s.whatsapp.net", name: getBotName(sender) }));

      // 3. Attente optimisée (12 secondes max pour éviter le timeout strict)
      let code = null;
      for (let i = 0; i < 12; i++) {
        await delay(1000); 
        if (fs.existsSync(codeFilePath)) {
          try {
            const data = JSON.parse(fs.readFileSync(codeFilePath, 'utf-8'));
            if (data.code) {
              code = data.code;
              // Suppression du fichier après lecture pour libérer le système
              fs.unlinkSync(codeFilePath);
              break;
            }
          } catch (e) { continue; }
        }
      }

      // 4. Nettoyage de la requête
      if (fs.existsSync(requestFile)) fs.unlinkSync(requestFile);

      // 5. Réponse finale
      if (code) {
        await kaya.sendMessage(from, { text: `✅ *Pairing code generated!*\n\n🔑 Code: \`${code}\`\n\n1. Go to Linked Devices\n2. Link a device\n3. Enter this code` }, { quoted: mek });
      } else {
        await kaya.sendMessage(from, { text: '❌ *Error:* Pairing code generation timed out.' }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ Pairing Error:', err);
      await kaya.sendMessage(from, { text: '❌ An error occurred during pairing.' }, { quoted: mek });
    }
  }
};
