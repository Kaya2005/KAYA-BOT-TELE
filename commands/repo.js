// ==================== commands/repo.js ====================
import { getBotName } from '../setting/botAssets.js';

export default {
  name: 'repo',
  alias: ['script', 'source'],
  description: 'Shows official bot links',
  category: 'General',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);

      const message = 
        `╭─── 🔗 *ᴏғғɪᴄɪᴀʟ ʟɪɴᴋs* ───╮\n` +
        `│\n` +
        `│  *ʙᴏᴛ ɴᴀᴍᴇ :* ${botName}\n` +
        `│\n` +
        `│  • *ᴄᴏɴɴᴇᴄᴛ ʙᴏᴛ :*\n` +
        `│    ᴛ.ᴍᴇ/ᴋᴀʏᴀ243\n` +
        `│\n` +
        `│  • *ᴡʜᴀᴛsᴀᴘᴘ ᴄᴏᴍᴍᴜɴɪᴛʏ :*\n` +
        `│    ʜᴛᴛᴘs://ᴡʜᴀᴛsᴀᴘᴘ.ᴄᴏᴍ/ᴄʜᴀɴɴᴇʟ/0029Vb91eHA7Noa7fCn1vp3j\n` +
        `│\n` +
        `│  • *sᴛᴀᴛᴜs :* ᴏɴʟɪɴᴇ & ᴏᴘᴛɪᴍɪᴢᴇᴅ\n` +
        `│\n` +
        `╰──────────────────────────╯`;

      return await kaya.sendMessage(from, { text: message }, { quoted: mek });

    } catch (err) {
      console.error('❌ repo.js error:', err);
      return await kaya.sendMessage(from, { text: '╭─── ❌ *ᴇʀʀᴏʀ* ───╮\n│\n│  ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ.\n│\n╰──────────────────╯' }, { quoted: mek });
    }
  }
};
