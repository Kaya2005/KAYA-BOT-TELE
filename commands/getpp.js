import { getBotName } from '../setting/botAssets.js';

export default {
  name: 'getpp',
  alias: ['pfp'],
  description: '📸 Retrieves the profile picture of a user',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // 1. Gestion sûre du nom du bot
      let botName = 'Kaya';
      try {
        botName = getBotName(from) || 'Kaya';
      } catch (e) {
        console.warn('⚠️ getBotName failed, using default name.');
      }
      
      // 2. Identification de la cible
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      const quotedParticipant = mek.message?.extendedTextMessage?.contextInfo?.participant;
      const sender = mek.sender;
      
      let target = mentioned?.[0] || quotedParticipant || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

      if (!target) {
        return await kaya.sendMessage(from, { text: `*⚠️ TARGET ERROR*\nPlease mention a user, reply to their message, or type their number.` }, { quoted: mek });
      }

      // 3. Récupération de l'image (Logique corrigée)
      let pfpUrl;
      try {
        // 'image' est le type par défaut, parfois il faut être spécifique
        pfpUrl = await kaya.profilePictureUrl(target, 'image').catch(() => null);
        
        if (!pfpUrl) {
          return await kaya.sendMessage(from, { text: '❌ The user has no profile picture or it is private.' }, { quoted: mek });
        }
      } catch (err) {
        console.error('❌ Error fetching PFP:', err);
        return await kaya.sendMessage(from, { text: '❌ Could not retrieve profile picture.' }, { quoted: mek });
      }

      // 4. Envoi
      const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n📸 *USER PROFILE PICTURE*\n👤 @${target.split('@')[0]}`;

      return await kaya.sendMessage(from, {
        image: { url: pfpUrl },
        caption: caption,
        mentions: [target]
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ getpp.js global error:', err);
      return await kaya.sendMessage(from, { text: `❌ An error occurred: ${err.message}` }, { quoted: mek });
    }
  }
};
