import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';
import fs from 'fs';
import path from 'path';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const PAIRING_FOLDER = './richstore/pairing';
const COOLDOWN_FILE = path.join(PAIRING_FOLDER, 'cooldown.json');
const COOLDOWN_MS = 30000; // 30 secondes

export default {
  name: 'pair',
  description: '🔗 Link your WhatsApp account to the bot',
  category: 'General',
  usage: '.pair <number>',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      
      if (!fs.existsSync(PAIRING_FOLDER)) fs.mkdirSync(PAIRING_FOLDER, { recursive: true });

      if (!args[0]) {
        return await sendWithBotImage(kaya, from, sender, { 
            caption: `*PAIRING HELP* 🔗\n\nUsage: \`${prefix}pair 243xxxxxxxxx\``,
            contextInfo: getContextInfo() 
        });
      }

      const targetNumber = args[0].replace(/[^0-9]/g, '');
      const lockFile = path.join(PAIRING_FOLDER, `lock_${targetNumber}.json`);

      // 1. VÉRIFICATION DU COOLDOWN GLOBAL (30 secondes)
      if (fs.existsSync(COOLDOWN_FILE)) {
        const lastTime = JSON.parse(fs.readFileSync(COOLDOWN_FILE, 'utf-8')).timestamp;
        if (Date.now() - lastTime < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastTime)) / 1000);
            return await kaya.sendMessage(from, { text: `⚠️ *Serveur en attente...*\n\nVeuillez patienter *${remaining} secondes* avant la prochaine génération.` }, { quoted: mek });
        }
      }

      // 2. VÉRIFICATION DU VERROUILLAGE (Si un autre bot travaille déjà sur ce numéro)
      if (fs.existsSync(lockFile)) {
        return await kaya.sendMessage(from, { text: '⚠️ *Info:* Un autre bot génère déjà le code pour ce numéro. Veuillez patienter.' }, { quoted: mek });
      }

      // 3. CRÉATION DU VERROU
      fs.writeFileSync(lockFile, JSON.stringify({ bot: kaya.user.id, timestamp: Date.now() }));
      // Mise à jour du cooldown global
      fs.writeFileSync(COOLDOWN_FILE, JSON.stringify({ timestamp: Date.now() }));

      const requestFile = path.join(PAIRING_FOLDER, `request_${targetNumber}.json`);
      const codeFilePath = path.join(PAIRING_FOLDER, `pairing_${targetNumber}.json`);

      if (fs.existsSync(codeFilePath)) fs.unlinkSync(codeFilePath);

      // 4. Création de la requête
      fs.writeFileSync(requestFile, JSON.stringify({ jid: targetNumber + "@s.whatsapp.net", name: getBotName(sender) }));

      await kaya.sendMessage(from, { text: '⏳ *Generating pairing code...*' }, { quoted: mek });

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

      // 5. NETTOYAGE
      if (fs.existsSync(requestFile)) fs.unlinkSync(requestFile);
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);

      if (code) {
        await kaya.sendMessage(from, { text: `✅ *Pairing code generated!*\n\n🔑 Code: \`${code}\`\n\n1. Go to Linked Devices\n2. Link a device\n3. Enter this code` }, { quoted: mek });
      } else {
        await kaya.sendMessage(from, { text: '❌ *Error:* Pairing code generation timed out.' }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ Pairing Error:', err);
      // Nettoyage en cas d'erreur
      const targetNumber = args[0]?.replace(/[^0-9]/g, '');
      const lockFile = path.join(PAIRING_FOLDER, `lock_${targetNumber}.json`);
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
      
      await kaya.sendMessage(from, { text: '❌ An error occurred during pairing.' }, { quoted: mek });
    }
  }
};
