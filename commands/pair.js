import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';
import fs from 'fs';
import path from 'path';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const PAIRING_FOLDER = './richstore/pairing';
const COOLDOWN_FILE = path.join(PAIRING_FOLDER, 'cooldown.json');
const COOLDOWN_MS = 30000; 

export default {
  name: 'pair',
  description: '🔗 Link your WhatsApp account to the bot',
  category: 'General',
  usage: '.pair [number]',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      
      // 1. EXTRACTION AUTOMATIQUE DU NUMÉRO
      let targetNumber = args[0] ? args[0].replace(/[^0-9]/g, '') : sender.split('@')[0].replace(/[^0-9]/g, '');

      if (!targetNumber) {
        return await kaya.sendMessage(from, { text: '❌ *Erreur:* Impossible de détecter votre numéro. Utilisez `.pair 243xxxxxxxxx`' }, { quoted: mek });
      }

      if (!fs.existsSync(PAIRING_FOLDER)) fs.mkdirSync(PAIRING_FOLDER, { recursive: true });

      const lockFile = path.join(PAIRING_FOLDER, `lock_${targetNumber}.json`);

      // 2. VÉRIFICATION DU COOLDOWN GLOBAL
      if (fs.existsSync(COOLDOWN_FILE)) {
        const lastTime = JSON.parse(fs.readFileSync(COOLDOWN_FILE, 'utf-8')).timestamp;
        if (Date.now() - lastTime < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastTime)) / 1000);
            return await kaya.sendMessage(from, { text: `⚠️ *Serveur en attente...*\n\nVeuillez patienter *${remaining} secondes* avant la prochaine génération.` }, { quoted: mek });
        }
      }

      // 3. VÉRIFICATION DU VERROUILLAGE
      if (fs.existsSync(lockFile)) {
        return await kaya.sendMessage(from, { text: '⚠️ *Info:* Une génération est déjà en cours pour ce numéro.' }, { quoted: mek });
      }

      // 4. CRÉATION DES FICHIERS DE CONTRÔLE
      fs.writeFileSync(lockFile, JSON.stringify({ bot: kaya.user.id, timestamp: Date.now() }));
      fs.writeFileSync(COOLDOWN_FILE, JSON.stringify({ timestamp: Date.now() }));

      const requestFile = path.join(PAIRING_FOLDER, `request_${targetNumber}.json`);
      const codeFilePath = path.join(PAIRING_FOLDER, `pairing_${targetNumber}.json`);

      if (fs.existsSync(codeFilePath)) fs.unlinkSync(codeFilePath);

      // 5. CRÉATION DE LA REQUÊTE
      fs.writeFileSync(requestFile, JSON.stringify({ jid: targetNumber + "@s.whatsapp.net", name: getBotName(sender) }));

      await kaya.sendMessage(from, { text: `⏳ *Génération du code pour :* ${targetNumber}...\n(Vous avez 30 secondes)` }, { quoted: mek });

      // 6. BOUCLE D'ATTENTE (30 SECONDES)
      let code = null;
      for (let i = 0; i < 30; i++) {
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

      // 7. NETTOYAGE SI ÉCHEC (TIMEOUT)
      if (!code) {
        if (fs.existsSync(requestFile)) fs.unlinkSync(requestFile);
        if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
        return await kaya.sendMessage(from, { text: '❌ *Erreur:* Délai dépassé. La demande a été annulée. Veuillez réessayer.' }, { quoted: mek });
      }

      // 8. SUCCÈS : NETTOYAGE ET ENVOI DU CODE
      if (fs.existsSync(requestFile)) fs.unlinkSync(requestFile);
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);

      await kaya.sendMessage(from, { text: `✅ *Code généré avec succès !*\n\n🔑 Code: \`${code}\`\n\n📌 *Attention :* Vous avez 30 secondes pour l'utiliser.\n\n1. Allez dans "Appareils liés"\n2. Choisissez "Connecter un appareil"\n3. Entrez ce code` }, { quoted: mek });

    } catch (err) {
      console.error('❌ Pairing Error:', err);
      // Nettoyage en cas d'erreur critique
      const targetNumber = args[0]?.replace(/[^0-9]/g, '') || mek.sender.split('@')[0];
      const lockFile = path.join(PAIRING_FOLDER, `lock_${targetNumber}.json`);
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
      
      await kaya.sendMessage(from, { text: '❌ Une erreur est survenue lors de la génération.' }, { quoted: mek });
    }
  }
};
