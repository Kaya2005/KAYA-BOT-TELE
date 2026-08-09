import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';
import fs from 'fs';
import path from 'path';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const PAIRING_FOLDER = './richstore/pairing';
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
      
      if (!fs.existsSync(PAIRING_FOLDER)) fs.mkdirSync(PAIRING_FOLDER, { recursive: true });

      if (!args[0]) {
        return await sendWithBotImage(kaya, from, sender, { 
            caption: `*PAIRING HELP* 🔗\n\nUsage: \`${prefix}pair 243xxxxxxxxx\``,
            contextInfo: getContextInfo(sender) 
        });
      }

      const rawInput = args[0];
      const targetNumber = rawInput.replace(/[^0-9]/g, '');

      // 🔍 NUMBER FORMAT CHECK (Detects '+', letters, or invalid length)
      if (rawInput.includes('+') || /[^0-9]/.test(rawInput) || targetNumber.length < 8 || targetNumber.length > 15) {
        return await sendWithBotImage(kaya, from, sender, { 
            caption: `⚠️ *Invalid Number Format* ❌\n\n- Do **not** include the \`+\` sign.\n- Enter only your phone number digits (including country code).\n\n👉 *Correct example:* \`${prefix}pair 243999999999\``,
            contextInfo: getContextInfo(sender) 
        });
      }

      const lockFile = path.join(PAIRING_FOLDER, `lock_${targetNumber}.json`);

      // 1. GLOBAL COOLDOWN CHECK (30 seconds)
      if (fs.existsSync(COOLDOWN_FILE)) {
        const lastTime = JSON.parse(fs.readFileSync(COOLDOWN_FILE, 'utf-8')).timestamp;
        if (Date.now() - lastTime < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastTime)) / 1000);
            return await kaya.sendMessage(from, { text: `⚠️ *Server busy...*\n\nPlease wait *${remaining} seconds* before the next generation.` }, { quoted: mek });
        }
      }

      // 2. LOCK CHECK (If another bot is already processing this number)
      if (fs.existsSync(lockFile)) {
        return await kaya.sendMessage(from, { text: '⚠️ *Info:* Another bot is already generating a code for this number. Please wait.' }, { quoted: mek });
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

      // 5. CLEANUP
      if (fs.existsSync(requestFile)) fs.unlinkSync(requestFile);
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);

      if (code) {
        await kaya.sendMessage(from, { text: `✅ *Pairing code generated!*\n\n🔑 Code: \`${code}\`\n\n1. Go to Linked Devices\n2. Link a device\n3. Enter this code` }, { quoted: mek });
      } else {
        await kaya.sendMessage(from, { text: '❌ *Error:* Pairing code generation timed out.' }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ Pairing Error:', err);
      // Cleanup on error
      const targetNumber = args[0]?.replace(/[^0-9]/g, '');
      if (targetNumber) {
        const lockFile = path.join(PAIRING_FOLDER, `lock_${targetNumber}.json`);
        if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
      }
      
      await kaya.sendMessage(from, { text: '❌ An error occurred during pairing.' }, { quoted: mek });
    }
  }
};
