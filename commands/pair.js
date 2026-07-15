import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';
import fs from 'fs';
import path from 'path';

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
      
      if (!fs.existsSync(pairingFolder)) fs.mkdirSync(pairingFolder, { recursive: true });

      if (!args[0]) {
        return await sendWithBotImage(kaya, from, sender, { 
            caption: `*PAIRING HELP* 🔗\n\nUsage: \`${prefix}pair 243xxxxxxxxx\``,
            contextInfo: getContextInfo() 
        });
      }

      const targetNumber = args[0].replace(/[^0-9]/g, '');
      const lockFile = path.join(pairingFolder, `lock_${targetNumber}.json`);

      // 1. VÉRIFICATION DU VERROUILLAGE (Si un autre bot travaille déjà dessus)
      if (fs.existsSync(lockFile)) {
        return await kaya.sendMessage(from, { text: '⚠️ *Info:* Un autre bot est déjà en train de générer le code pour ce numéro. Veuillez patienter.' }, { quoted: mek });
      }

      // 2. CRÉATION DU VERROU (On se déclare propriétaire de la tâche)
      fs.writeFileSync(lockFile, JSON.stringify({ bot: kaya.user.id, timestamp: Date.now() }));

      const requestFile = path.join(pairingFolder, `request_${targetNumber}.json`);
      const codeFilePath = path.join(pairingFolder, `pairing_${targetNumber}.json`);

      if (fs.existsSync(codeFilePath)) fs.unlinkSync(codeFilePath);

      // 3. Création de la requête
      fs.writeFileSync(requestFile, JSON.stringify({ jid: targetNumber + "@s.whatsapp.net", name: getBotName(sender) }));

      const waitMsg = await kaya.sendMessage(from, { text: '⏳ *Generating pairing code...*' }, { quoted: mek });

      let code = null;
      for (let i = 0; i < 12; i++) {
        await delay(1000); 
        if (fs.existsSync(codeFilePath)) {
          try {
            const data = JSON.parse(fs.readFileSync(codeFilePath, 'utf-8'));
            if (data.code) {
              code = data.code;
              fs.unlinkSync(codeFilePath);
              break;
            }
          } catch (e) { continue; }
        }
      }

      // 4. NETTOYAGE FINAL
      if (fs.existsSync(requestFile)) fs.unlinkSync(requestFile);
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile); // On libère le verrou

      if (code) {
        await kaya.sendMessage(from, { text: `✅ *Pairing code generated!*\n\n🔑 Code: \`${code}\`\n\n1. Go to Linked Devices\n2. Link a device\n3. Enter this code` }, { quoted: mek });
      } else {
        await kaya.sendMessage(from, { text: '❌ *Error:* Pairing code generation timed out.' }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ Pairing Error:', err);
      // Nettoyage en cas d'erreur
      const lockFile = path.join('./richstore/pairing', `lock_${args[0]?.replace(/[^0-9]/g, '')}.json`);
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
      
      await kaya.sendMessage(from, { text: '❌ An error occurred during pairing.' }, { quoted: mek });
    }
  }
};
