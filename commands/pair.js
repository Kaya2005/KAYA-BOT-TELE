import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';
import fs from 'fs';
import path from 'path';

export default {
  name: 'pair',
  description: '🔗 Link your WhatsApp account to the bot',
  category: 'General',
  usage: '.pair <number>',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);
      const pairingFolder = './richstore/pairing';

      // Vérification de l'argument
      if (!args[0]) {
        return await sendWithBotImage(kaya, from, sender, { 
            caption: `*PAIRING HELP* 🔗\n\n` +
                     `To link your account, use the format below:\n` +
                     `*Usage:* \`${prefix}pair 243xxxxxxxxx\`\n\n` +
                     `> _Example: ${prefix}pair 243910474238_`,
            contextInfo: getContextInfo() 
        });
      }

      const targetNumber = args[0].replace(/[^0-9]/g, '');
      // IMPORTANT: Nous utilisons targetNumber comme identifiant pour permettre de pairer d'autres numéros
      const sessionIdentifier = targetNumber; 

      // Création du fichier de requête pour le système automatique
      const requestFile = path.join(pairingFolder, `request_${sessionIdentifier}.json`);
      fs.writeFileSync(requestFile, JSON.stringify({ 
          jid: targetNumber + "@s.whatsapp.net", 
          name: botName 
      }));

      // Message de confirmation élégant
      await kaya.sendMessage(from, { 
          text: `✅ *Pairing Request Received*\n\n` +
                `The system is now generating your pairing code for *+${targetNumber}*.\n` +
                `Please wait a few seconds, the code will appear in the pairing folder.` 
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ Pairing Error:', err);
      await kaya.sendMessage(from, { text: '❌ An internal error occurred while processing your request.' }, { quoted: mek });
    }
  }
};
