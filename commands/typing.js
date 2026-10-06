// ==================== commands/typing.js ====================
import { getBotName } from '../setting/botAssets.js';
import { getSetting, setSetting } from '../setting.js';

export default {
  name: 'typing',
  description: 'Enable or disable automatic typing mode',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Nettoyage de l'ID du bot pour la conformité avec userall/{ownerId}/
      const ownerId = kaya.user.id.split(':')[0];
      const botName = getBotName(kaya.user.id);
      const action = args[0]?.toLowerCase();

      if (!['on', 'off', 'status'].includes(action)) {
        const text = 
          `╭─── ❌ *ᴜsᴀɢᴇ ᴇʀʀᴏʀ* ───╮\n` +
          `│\n` +
          `│  *ʙᴏᴛ :* ${botName}\n` +
          `│  *ᴜsᴀɢᴇ :*\n` +
          `│  • \`${prefix}typing <on/off/status>\`\n` +
          `│\n` +
          `╰──────────────────────╯`;

        return await kaya.sendMessage(from, { text }, { quoted: mek });
      }

      if (action === 'on') {
        setSetting(ownerId, 'typing', true);
        const text = 
          `╭─── ✅ *sᴇᴛᴛɪɴɢs* ───╮\n` +
          `│\n` +
          `│  *ᴛʏᴘɪɴɢ* ᴍᴏᴅᴇ ᴇɴᴀʙʟᴇᴅ.\n` +
          `│\n` +
          `╰──────────────────╯`;
        return await kaya.sendMessage(from, { text }, { quoted: mek });
      }

      if (action === 'off') {
        setSetting(ownerId, 'typing', false);
        const text = 
          `╭─── ❌ *sᴇᴛᴛɪɴɢs* ───╮\n` +
          `│\n` +
          `│  *ᴛʏᴘɪɴɢ* ᴍᴏᴅᴇ ᴅɪsᴀʙʟᴇᴅ.\n` +
          `│\n` +
          `╰──────────────────╯`;
        return await kaya.sendMessage(from, { text }, { quoted: mek });
      }

      if (action === 'status') {
        const status = getSetting(ownerId, 'typing', false);
        const statusText = status ? '✅ ᴇɴᴀʙʟᴇᴅ' : '❌ ᴅɪsᴀʙʟᴇᴅ';
        const text = 
          `╭─── 📊 *sᴛᴀᴛᴜs* ───╮\n` +
          `│\n` +
          `│  *ᴛʏᴘɪɴɢ ᴍᴏᴅᴇ :*\n` +
          `│  ${statusText}\n` +
          `│\n` +
          `╰──────────────────╯`;
        return await kaya.sendMessage(from, { text }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ typing.js error:', err);
      const errText = 
        `╭─── ❌ *ᴇʀʀᴏʀ* ───╮\n` +
        `│\n` +
        `│  ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ.\n` +
        `│\n` +
        `╰──────────────────╯`;
      return await kaya.sendMessage(from, { text: errText }, { quoted: mek });
    }
  }
};
