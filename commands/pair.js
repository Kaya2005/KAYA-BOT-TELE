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
      
      // Utilisation du numéro de l'expéditeur (sender) comme ID de session unique
      const sessionIdentifier = sender.replace(/[^0-9]/g, ''); 

      // 3. Feedback utilisateur
      await kaya.sendMessage(from, { text: '⏳ *Génération du code en cours, veuillez patienter...*' }, { quoted: mek });

      // 4. Lancement du processus de pairage
      await startpairing(jid, sessionIdentifier, botName);

      // 5. Attente du fichier de code (max 10 secondes)
      const filePath = path.join(pairingFolder, `pairing_${sessionIdentifier}.json`);
      let attempts = 0;
      let code = null;

      while (attempts < 10) {
        if (fs.existsSync(filePath)) {
          try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            code = data.code;
            break;
          } catch (e) {}
        }
        await new Promise(r => setTimeout(r, 1000));
        attempts++;
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
