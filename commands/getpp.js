import { getBotName } from '../setting/botAssets.js';

export default {
  name: 'getpp',
  alias: ['pfp'],
  description: '📸 Retrieves the profile picture of a user',
  category: 'Owner',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      let botName = 'Kaya';
      try { botName = getBotName(from) || 'Kaya'; } catch (e) {}
      
      // --- LOGIQUE CIBLE CORRIGÉE ---
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const quotedParticipant = mek.message?.extendedTextMessage?.contextInfo?.participant;
      
      // On extrait le numéro correctement
      let targetNumber = mentioned || quotedParticipant || (args[0] ? args[0].replace(/[^0-9]/g, '') : null);
      
      // Si aucune cible n'est donnée, on utilise l'expéditeur (ou la personne en privé)
      if (!targetNumber) {
        targetNumber = mek.sender;
      }

      // S'assurer que le JID se termine par @s.whatsapp.net
      const target = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
      // ------------------------------

      let pfpUrl;
      try {
        pfpUrl = await kaya.profilePictureUrl(target, 'image');
      } catch (err) {
        return await kaya.sendMessage(from, { text: '❌ No profile picture found for this user.' }, { quoted: mek });
      }

      const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n📸 *USER PROFILE PICTURE*\n👤 @${target.split('@')[0]}`;

      return await kaya.sendMessage(from, {
        image: { url: pfpUrl },
        caption: caption,
        mentions: [target]
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ getpp.js error:', err);
      return await kaya.sendMessage(from, { text: `❌ An error occurred.` }, { quoted: mek });
    }
  }
};
