// compliment.js
import { getBotName } from '../setting/botAssets.js';
import { getString } from '../setting/language.js';

const complimentsFr = [
    "ᴛᴜ ᴇs ɪɴᴄʀᴏʏᴀʙʟᴇ ᴛᴇʟ ǫᴜᴇ ᴛᴜ ᴇs !",
    "ᴛᴜ ᴀs ᴜɴ sᴇɴs ᴅᴇ l'ʜᴜᴍᴏᴜʀ ɢᴇ́ɴɪᴀʟ !",
    "ᴛᴜ ᴇs ɪɴᴄʀᴏʏᴀʙʟᴇᴍᴇɴᴛ ᴀᴛᴛᴇɴᴛɪᴏɴɴᴇ́ ᴇᴛ ɢᴇɴᴛɪʟ.",
    "ᴛᴜ ᴇs ᴘʟᴜs ᴘᴜɪssᴀɴᴛ ǫᴜᴇ ᴛᴜ ɴᴇ ʟᴇ ᴄʀᴏɪs.",
    "ᴛᴜ ɪʟʟᴜᴍɪɴᴇs ʟᴀ ᴘɪᴇ̀ᴄᴇ !",
    "ᴛᴜ ᴇs ᴜɴ ᴠʀᴀɪ ᴀᴍɪ.",
    "ᴛᴜ ᴍ'ɪɴsᴘɪʀᴇs !",
    "ᴛᴜ ᴇs ɪɴᴛᴇʟʟɪɢᴇɴᴛ ᴄᴏᴍᴍᴇ ʟᴇ ʀᴏɪ ɴᴏɪʀ ʟᴇ́ᴏɴɪᴅᴀs.",
    "ᴛᴜ ᴀs ᴜɴ ᴄᴏᴇᴜʀ ᴇɴ ᴏʀ.",
    "ᴛᴜ ғᴀɪs ᴜɴᴇ ᴅɪғғᴇ́ʀᴇɴᴄᴇ ᴅᴀɴs ʟᴇ ᴍᴏɴᴅᴇ.",
    "ᴛᴀ ᴘᴏsɪᴛɪᴠɪᴛᴇ́ ᴇsᴛ ᴄᴏɴᴛᴀɢɪᴇᴜsᴇ !",
    "ᴛᴜ ᴀs ᴜɴᴇ ᴇ́ᴛʜɪǫᴜᴇ ᴅᴇ ᴛʀᴀᴠᴀɪʟ ɪɴᴄʀᴏʏᴀʙʟᴇ.",
    "ᴛᴜ ғᴀɪs ʀᴇssᴏʀᴛɪʀ ʟᴇ ᴍᴇɪʟʟᴇᴜʀ ᴄʜᴇᴢ ʟᴇs ᴀᴜᴛʀᴇs.",
    "ᴛᴏɴ sᴏᴜʀʀɪᴇʀ ɪʟʟᴜᴍɪɴᴇ ʟᴀ ᴊᴏᴜʀɴᴇ́ᴇ ᴅᴇ ᴛᴏᴜᴛ ʟᴇ ᴍᴏɴᴅᴇ.",
    "ᴛᴜ ᴇs ᴅᴏᴜᴇ́ ᴅᴀɴs ᴛᴏᴜᴛ ᴄᴇ ǫᴜᴇ ᴛᴜ ғᴀɪs.",
    "ᴛᴀ ɢᴇɴᴛɪʟʟᴇssᴇ ʀᴇɴᴅ ʟᴇ ᴍᴏɴᴅᴇ ᴍᴇɪʟʟᴇᴜʀ.",
    "ᴛᴜ ᴀs ᴜɴᴇ ᴘᴇʀsᴘᴇᴄᴛɪᴠᴇ ᴜɴɪǫᴜᴇ ᴇᴛ ᴍᴇʀᴠᴇɪʟʟᴇᴜsᴇ.",
    "ᴛᴏɴ ᴇɴᴛʜᴏᴜsɪᴀsᴍᴇ ᴇsᴛ ᴠʀᴀɪᴍᴇɴᴛ ɪɴsᴘɪʀᴀɴᴛ !",
    "ᴛᴜ ᴇs ᴄᴀᴘᴀʙʟᴇ d’ᴀᴄᴄᴏᴍᴘʟɪʀ ᴅᴇ ɢʀᴀɴᴅᴇs ᴄʜᴏsᴇs.",
    "ᴛᴜ sᴀɪs ᴛᴏᴜᴊᴏᴜʀs ᴄᴏᴍᴍᴇɴᴛ ʀᴇɴᴅʀᴇ quelqu’ᴜɴ sᴘᴇ́ᴄɪᴀʟ.",
    "ᴛᴀ ᴄᴏɴғɪᴀɴᴄᴇ ᴇsᴛ ᴀᴅᴍɪʀᴀʙʟᴇ.",
    "ᴛᴜ ᴀs ᴜɴᴇ ʙᴇʟʟᴇ âᴍᴇ.",
    "ᴛᴀ gᴇ́ɴᴇ́ʀᴏsɪᴛᴇ́ n’ᴀ ᴘᴀs ᴅᴇ ʟɪᴍɪᴛᴇs.",
    "ᴛᴜ ᴀs ᴜɴ oᴇɪʟ ᴇxᴄᴇᴘᴛɪᴏɴɴᴇʟ ᴘᴏᴜʀ ʟᴇs ᴅᴇ́ᴛᴀɪʟs.",
    "ᴛᴀ ᴘᴀssɪᴏɴ ᴇsᴛ ᴠʀᴀɪᴍᴇɴᴛ ᴍᴏᴛɪᴠᴀɴᴛᴇ !",
    "ᴛᴜ ᴇs ᴜɴ(ᴇ) ᴀᴜᴅɪᴛᴇᴜʀ(ᴛʀɪᴄᴇ) ᴇxᴄᴇᴘᴛɪᴏɴɴᴇʟ(ʟᴇ).",
    "ᴛᴜ ᴇs ᴘʟᴜs ғᴏʀᴛ(ᴇ) ǫᴜᴇ ᴛᴜ ɴᴇ ʟᴇ ᴘᴇɴsᴇ !",
    "ᴛᴏɴ ʀɪʀᴇ ᴇsᴛ ᴄᴏɴᴛᴀɢɪᴇᴜx.",
    "ᴛᴜ ᴀs ᴜɴ ᴅᴏɴ ɴᴀᴛᴜʀᴇʟ ᴘᴏᴜʀ ᴠᴀʟᴏʀɪsᴇʀ ʟᴇs ᴀᴜᴛʀᴇs.",
    "ᴛᴜ ʀᴇɴᴅs ʟᴇ ᴍᴏɴᴅᴇ ᴍᴇɪʟʟᴇᴜʀ sɪᴍᴘʟᴇᴍᴇɴᴛ en éᴛᴀɴᴛ lᴀ̀."
];

const complimentsEn = [
    "ʏᴏᴜ ᴀʀᴇ ᴀᴍᴀᴢɪɴɢ ᴊᴜsᴛ ᴛʜᴇ ᴡᴀʏ ʏᴏᴜ ᴀʀᴇ !",
    "ʏᴏᴜ ʜᴀᴠᴇ ᴀɴ ᴀᴡᴇsᴏᴍᴇ sᴇɴsᴇ ᴏғ ʜᴜᴍᴏʀ !",
    "ʏᴏᴜ ᴀʀᴇ ɪɴᴄʀᴇᴅɪʙʟʏ ᴛʜᴏᴜɢʜᴛғᴜʟ ᴀɴᴅ ᴋɪɴᴅ.",
    "ʏᴏᴜ ᴀʀᴇ ᴍᴏʀᴇ ᴘᴏᴡᴇʀғᴜʟ ᴛʜᴀɴ ʏᴏᴜ ᴋɴᴏᴡ.",
    "ʏᴏᴜ ʟɪɢʜᴛ ᴜᴘ ᴛʜᴇ ʀᴏᴏᴍ !",
    "ʏᴏᴜ ᴀʀᴇ ᴀ ᴛʀᴜᴇ ғʀɪᴇɴᴅ.",
    "ʏᴏᴜ ɪɴsᴘɪʀᴇ ᴍᴇ !",
    "ʏᴏᴜ ʜᴀᴠᴇ ᴀ ʜᴇᴀʀᴛ ᴏғ ɢᴏʟᴅ.",
    "ʏᴏᴜ ᴍᴀᴋᴇ ᴀ ᴅɪғғᴇʀᴇɴᴄᴇ ɪɴ ᴛʜᴇ ᴡᴏʀʟᴅ.",
    "ʏᴏᴜʀ ᴘᴏsɪᴛɪᴠɪᴛʏ ɪs ᴄᴏɴᴛᴀɢɪᴏᴜs !",
    "ʏᴏᴜ ʜᴀᴠᴇ ᴀɴ ɪɴᴄʀᴇᴅɪʙʟᴇ ᴡᴏʀᴋ ᴇᴛʜɪᴄ.",
    "ʏᴏᴜ ʙʀɪɴɢ ᴏᴜᴛ ᴛʜᴇ ʙᴇsᴛ ɪɴ ᴏᴛʜᴇʀs.",
    "ʏᴏᴜʀ sᴍɪʟᴇ ʙʀɪɢʜᴛᴇɴs ᴇᴠᴇʀʏᴏɴᴇ's ᴅᴀʏ.",
    "ʏᴏᴜ ᴀʀᴇ ᴛᴀʟᴇɴᴛᴇᴅ ᴀᴛ ᴇᴠᴇʀʏᴛʜɪɴɢ ʏᴏᴜ ᴅᴏ.",
    "ʏᴏᴜʀ ᴋɪɴᴅɴᴇss ᴍᴀᴋᴇs ᴛʜᴇ ᴡᴏʀʟᴅ ᴀ ʙᴇᴛᴛᴇʀ ᴘʟᴀᴄᴇ.",
    "ʏᴏᴜ ʜᴀᴠᴇ ᴀ ᴜɴɪǫᴜᴇ ᴀɴᴅ ᴡᴏɴᴅᴇʀғᴜʟ ᴘᴇʀsᴘᴇᴄᴛɪᴠᴇ.",
    "ʏᴏᴜʀ ᴇɴᴛʜᴜsɪᴀsᴍ ɪs ᴛʀᴜʟʏ ɪɴsᴘɪʀɪɴɢ !",
    "ʏᴏᴜ ᴀʀᴇ ᴄᴀᴘᴀʙʟᴇ ᴏғ ᴀᴄʜɪᴇᴠɪɴɢ ɢʀᴇᴀᴛ ᴛʜɪɴɢs.",
    "ʏᴏᴜ ᴀʟᴡᴀʏs ᴋɴᴏᴡ ʜᴏᴡ ᴛᴏ ᴍᴀᴋᴇ sᴏᴍᴇᴏɴᴇ ғᴇᴇʟ sᴘᴇᴄɪᴀʟ.",
    "ʏᴏᴜʀ ᴄᴏɴғɪᴅᴇɴᴄᴇ ɪs ᴀᴅᴍɪʀᴀʙʟᴇ.",
    "ʏᴏᴜ ʜᴀᴠᴇ ᴀ ʙᴇᴀᴜᴛɪғᴜʟ sᴏᴜʟ.",
    "ʏᴏᴜʀ ɢᴇɴᴇʀᴏsɪᴛʏ ᴋɴᴏᴡs ɴᴏ ʟɪᴍɪᴛs.",
    "ʏᴏᴜ ʜᴀᴠᴇ ᴀɴ ᴇxᴄᴇᴘᴛɪᴏɴᴀʟ ᴇʏᴇ ғᴏʀ ᴅᴇᴛᴀɪʟ.",
    "ʏᴏᴜʀ ᴘᴀssɪᴏɴ ɪs ᴛʀᴜʟʏ ᴍᴏᴛɪᴠᴀᴛɪɴɢ !",
    "ʏᴏᴜ ᴀʀᴇ ᴀɴ ᴇxᴄᴇᴘᴛɪᴏɴᴀʟ ʟɪsᴛᴇɴᴇʀ.",
    "ʏᴏᴜ ᴀʀᴇ sᴛʀᴏɴɢᴇʀ ᴛʜᴀɴ ʏᴏᴜ ᴛʜɪɴᴋ !",
    "ʏᴏᴜʀ ʟᴀᴜɢʜᴛᴇʀ ɪs ᴄᴏɴᴛᴀɢɪᴏᴜs.",
    "ʏᴏᴜ ʜᴀᴠᴇ ᴀ ɴᴀᴛᴜʀᴀʟ ɢɪғᴛ ғᴏʀ ᴜᴘʟɪғᴛɪɴɢ ᴏᴛʜᴇʀs.",
    "ʏᴏᴜ ᴍᴀᴋᴇ ᴛʜᴇ ᴡᴏʀʟᴅ ʙᴇᴛᴛᴇʀ ᴊᴜsᴛ ʙʏ ʙᴇɪɴɢ ɪɴ ɪᴛ."
];

export default {
  name: 'compliment',
  alias: ['complimenter', 'kudos', 'bravo'],
  category: 'Fun',
  description: 'Fait un compliment à un utilisateur mentionné ou en réponse à son message',
  usage: '.compliment @user ou reply à un message',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      const userLang = getSetting(ownerId, 'botLanguage', 'en');

      // 🔹 Déterminer la cible (Mention ou Reply)
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      const quotedParticipant = mek.message?.extendedTextMessage?.contextInfo?.participant;
      const userToCompliment = mentioned?.[0] || quotedParticipant;

      if (!userToCompliment) {
        const text = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰\n❌ *${getString(ownerId, 'complimentUsage')}*`;
        return await kaya.sendMessage(from, { text }, { quoted: mek });
      }

      // 🔹 Sélection aléatoire d’un compliment selon la langue du bot
      const activeCompliments = userLang === 'fr' ? complimentsFr : complimentsEn;
      const compliment = activeCompliments[Math.floor(Math.random() * activeCompliments.length)];

      // 🔹 Envoi du compliment
      await kaya.sendMessage(from, {
        text: `✨ Hey @${userToCompliment.split('@')[0]}, ${compliment}`,
        mentions: [userToCompliment]
      }, { quoted: mek });

    } catch (error) {
      console.error('❌ Erreur dans la commande compliment :', error);
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
      await kaya.sendMessage(from, {
        text: `❌ ${getString(ownerId, 'complimentError')}`
      }, { quoted: mek });
    }
  }
};
