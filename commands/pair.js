import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';
import startpairing from '../pair.js'; 
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

      // 1. Vérification des arguments
      if (!args[0]) {
        return await sendWithBotImage(kaya, from, sender, { 
            caption: `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*⚠️ AIDE PAIRAGE*\n\n*Usage:* \`${prefix}pair 243xxxxxxxxx\`\n*Note:* Ne mettez pas le signe +`,
            contextInfo: getContextInfo() 
        });
      }

      // 2. Préparation des identifiants
      const targetNumber = args[0].replace(/[^0-9]/g, '');
      const jid = targetNumber + "@s.whatsapp.net";
      const sessionIdentifier = sender.replace(/[^0-9]/g, ''); 

      // 3. Feedback utilisateur
      await kaya.sendMessage(from, { text: '⏳ *Génération du code en cours, veuillez patienter...*' }, { quoted: mek });

      // 4. Lancement du processus de pairage
      await startpairing(jid, sessionIdentifier, botName);

      // 5. Attente optimisée du fichier de code (max 10 secondes)
      const filePath = path.join(pairingFolder, `pairing_${sessionIdentifier}.json`);
      
      const waitForFile = (targetPath, timeout) => {
        return new Promise((resolve) => {
          const start = Date.now();
          const interval = setInterval(() => {
            if (fs.existsSync(targetPath)) {
              clearInterval(interval);
              resolve(true);
            } else if (Date.now() - start > timeout) {
              clearInterval(interval);
              resolve(false);
            }
          }, 1000);
        });
      };

      const fileExists = await waitForFile(filePath, 10000);
      let code = null;

      if (fileExists) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          code = data.code;
        } catch (e) {
          console.error('❌ Erreur lors de la lecture du fichier de pairage:', e);
        }
      }

      // 6. Réponse finale
      if (code) {
        const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*✅ CODE GÉNÉRÉ*\n\n🔑 *Code:* \`${code}\`\n\n*Instructions :*\n1. WhatsApp > Appareils connectés.\n2. Connecter un appareil.\n3. Entrez ce code sur votre téléphone.`;
        return await sendWithBotImage(kaya, from, sender, { caption, contextInfo: getContextInfo() });
      } else {
        return await kaya.sendMessage(from, { text: '❌ *Erreur:* Temps écoulé ou numéro invalide.' }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ pair.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ Une erreur est survenue lors de la génération du code.' }, { quoted: mek });
    }
  }
};
