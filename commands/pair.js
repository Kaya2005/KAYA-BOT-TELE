//pair.js
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';
import { getString } from '../setting/language.js';
import fs from 'fs';
import path from 'path';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const BASE_DIR = fs.existsSync("/home/container/Kaya-MD")
    ? "/home/container/Kaya-MD"
    : process.cwd();

const PAIRING_FOLDER = path.join(
    BASE_DIR,
    "data",
    "richstore",
    "pairing"
);

const COOLDOWN_FILE = path.join(PAIRING_FOLDER, 'cooldown.json');
const COOLDOWN_MS = 30000; // 30 seconds

export default {
  name: 'pair',
  description: '🔗 Link your WhatsApp account to the bot',
  category: 'General',
  usage: '.pair <number>',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      
      if (!fs.existsSync(PAIRING_FOLDER)) fs.mkdirSync(PAIRING_FOLDER, { recursive: true });

      if (!args[0]) {
        const caption = boxMessage(getString(ownerId, 'pairMenuTitle'), `• \`${prefix}pair 243xxxxxxxxx\``, '🔗');

        return await sendWithBotImage(kaya, from, sender, { 
            caption: caption
        });
      }

      const rawInput = args[0];
      const targetNumber = rawInput.replace(/[^0-9]/g, '');

      // 🔍 NUMBER FORMAT CHECK (Detects '+', letters, or invalid length)
      if (rawInput.includes('+') || /[^0-9]/.test(rawInput) || targetNumber.length < 8 || targetNumber.length > 15) {
        const warningContent = 
          `• ${getString(ownerId, 'pairRulePlus')}\n` +
          `• ${getString(ownerId, 'pairRuleDigits')}\n\n` +
          `• *${getString(ownerId, 'pairExampleLabel')} :*\n` +
          `  \`${prefix}pair 243999999999\``;

        const caption = boxMessage(getString(ownerId, 'pairInvalidTitle'), warningContent, '⚠️');

        return await sendWithBotImage(kaya, from, sender, { 
            caption: caption
        });
      }

      const lockFile = path.join(PAIRING_FOLDER, `lock_${targetNumber}.json`);

      // 1. GLOBAL COOLDOWN CHECK (30 seconds)
      if (fs.existsSync(COOLDOWN_FILE)) {
        try {
          const lastTime = JSON.parse(fs.readFileSync(COOLDOWN_FILE, 'utf-8')).timestamp;
          if (Date.now() - lastTime < COOLDOWN_MS) {
              const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastTime)) / 1000);
              const busyMsg = getString(ownerId, 'pairServerBusyMsg').replace('{remaining}', remaining);
              return await kaya.sendMessage(from, { 
                  text: boxMessage(getString(ownerId, 'pairServerBusyTitle'), busyMsg, '⚠️') 
              }, { quoted: mek });
          }
        } catch (e) {}
      }

      // 2. LOCK CHECK (If another bot is already processing this number)
      if (fs.existsSync(lockFile)) {
        return await kaya.sendMessage(from, { 
            text: boxMessage(getString(ownerId, 'pairBusyTitle'), getString(ownerId, 'pairBusyMsg'), '⚠️') 
        }, { quoted: mek });
      }

      // 3. LOCK CREATION
      fs.writeFileSync(lockFile, JSON.stringify({ bot: kaya.user.id, timestamp: Date.now() }));
      // Update global cooldown
      fs.writeFileSync(COOLDOWN_FILE, JSON.stringify({ timestamp: Date.now() }));

      const requestFile = path.join(PAIRING_FOLDER, `request_${targetNumber}.json`);
      const codeFilePath = path.join(PAIRING_FOLDER, `pairing_${targetNumber}.json`);

      if (fs.existsSync(codeFilePath)) fs.unlinkSync(codeFilePath);

      // 4. Request creation
      fs.writeFileSync(requestFile, JSON.stringify({ jid: targetNumber + "@s.whatsapp.net", name: getBotName(sender) }));

      await kaya.sendMessage(from, { text: `⏳ *${getString(ownerId, 'pairGenerating')}*` }, { quoted: mek });

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

      // 5. CLEANUP
      if (fs.existsSync(requestFile)) fs.unlinkSync(requestFile);
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);

      if (code) {
        const successText = `${getString(ownerId, 'pairCodeLabel')} : \`${code}\``;
        await kaya.sendMessage(from, { 
            text: successBox(successText) 
        }, { quoted: mek });
      } else {
        await kaya.sendMessage(from, { 
            text: boxMessage(getString(ownerId, 'pairTimeoutTitle'), getString(ownerId, 'pairTimeoutMsg'), '❌') 
        }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ Pairing Error:', err);
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      // Cleanup on error
      const targetNumber = args[0]?.replace(/[^0-9]/g, '');
      if (targetNumber) {
        const lockFile = path.join(PAIRING_FOLDER, `lock_${targetNumber}.json`);
        if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
      }
      
      await kaya.sendMessage(from, { 
          text: errorBox(`${getString(ownerId, 'pairError')} : ${err.message}`) 
      }, { quoted: mek });
    }
  }
};
