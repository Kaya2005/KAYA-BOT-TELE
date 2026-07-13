// prefix.js
import { getSetting, setSetting } from '../setting.js'; 
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
  name: 'prefix',
  description: 'Change or display the bot prefix',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Nettoyage de l'ID pour ne garder que la partie numérique (ex: 243...)
      const botId = kaya.user.id.split(':')[0];
      const currentPrefix = getSetting(botId, 'prefix', '.');
      
      const now = new Date();
      const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const date = now.toLocaleDateString('en-GB');

      // ================= SHOW PREFIX =================
      if (!args[0]) {
        const caption = `
▉ \`${getBotName(mek.sender)}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*⏱️ : ${time} • GMT*
*📅 : ${date}*
*⚙️ CURRENT PREFIX :* \`${currentPrefix}\`
______________________

💡 *Usage:* \`${prefix}prefix <new_prefix>\`
`.trim();

        return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo() });
      }

      // ================= SET PREFIX =================
      const newPrefix = args[0].trim();

      if (newPrefix.length > 3) {
        return await kaya.sendMessage(from, { text: '❌ *Error:* Prefix is too long (max 3 characters).' }, { quoted: mek });
      }

      // Enregistre dans le dossier spécifique à ce bot : userall/{botId}/settings.json
      setSetting(botId, 'prefix', newPrefix);

      const caption = `
▉ \`${getBotName(mek.sender)}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*✅ STATUS : PREFIX UPDATED*
______________________

New prefix set to: \`${newPrefix}\`
`.trim();

      return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo() });

    } catch (err) {
      console.error('❌ prefix.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ An error occurred.' }, { quoted: mek });
    }
  }
};
