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

      if (!args[0]) {
        return await sendWithBotImage(kaya, from, sender, { 
            caption: `*PAIRING HELP* 🔗\n\nUsage: \`${prefix}pair 243xxxxxxxxx\``,
            contextInfo: getContextInfo() 
        });
      }

      const targetNumber = args[0].replace(/[^0-9]/g, '');
      const sessionIdentifier = targetNumber; 

      // 1. Envoi du message d'attente
      const waitMsg = await kaya.sendMessage(from, { text: '⏳ *Generating pairing code...*' }, { quoted: mek });

      // 2. Création de la requête
      const requestFile = path.join(pairingFolder, `request_${sessionIdentifier}.json`);
      fs.writeFileSync(requestFile, JSON.stringify({ jid: targetNumber + "@s.whatsapp.net", name: botName }));

      // 3. Attente du fichier de code généré (max 10 secondes)
      const codeFilePath = path.join(pairingFolder, `pairing_${sessionIdentifier}.json`);
      let code = null;

      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000)); // Attendre 1s
        if (fs.existsSync(codeFilePath)) {
          try {
            const data = JSON.parse(fs.readFileSync(codeFilePath, 'utf-8'));
            code = data.code;
            break;
          } catch (e) {}
        }
      }

      // 4. Réponse finale avec le code
      if (code) {
        await kaya.sendMessage(from, { text: `✅ *Pairing code generated!*\n\n🔑 Code: \`${code}\`\n\n1. Go to Linked Devices\n2. Link a device\n3. Enter this code` }, { quoted: mek });
      } else {
        await kaya.sendMessage(from, { text: '❌ *Error:* Pairing code generation timed out.' }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ Pairing Error:', err);
      await kaya.sendMessage(from, { text: '❌ An error occurred.' }, { quoted: mek });
    }
  }
};
