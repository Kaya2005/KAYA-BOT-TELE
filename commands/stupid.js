import fetch from 'node-fetch';
import { getBotName } from '../setting/botAssets.js';

export default {
  name: "stupid",
  description: "Génère une carte 'it's so stupid' pour un utilisateur",
  category: "Fun",
  group: false,
  admin: false,
  botAdmin: false,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);

      // Déterminer la cible (Mention ou Reply)
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      const quotedParticipant = mek.message?.extendedTextMessage?.contextInfo?.participant;
      const who = mentioned?.[0] || quotedParticipant || sender;

      // Texte pour la carte (par défaut "im+stupid")
      const text = args?.length > 0 ? args.join(' ') : 'im+stupid';

      // Récupérer l'avatar
      let avatarUrl;
      try {
        avatarUrl = await kaya.profilePictureUrl(who, 'image');
      } catch {
        avatarUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
      }

      // Appel API
      const apiUrl = `https://some-random-api.com/canvas/misc/its-so-stupid?avatar=${encodeURIComponent(avatarUrl)}&dog=${encodeURIComponent(text)}`;
      const response = await fetch(apiUrl);

      if (!response.ok) throw new Error(`API responded with status: ${response.status}`);

      const imageBuffer = await response.buffer();

      // Envoyer l'image avec mention
      await kaya.sendMessage(from, {
        image: imageBuffer,
        caption: `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰\n*Target:* @${who.split('@')[0]}`,
        mentions: [who]
      }, { quoted: mek });

    } catch (error) {
      console.error('❌ Error in stupid command:', error);
      await kaya.sendMessage(from, { 
        text: '❌ Sorry, I couldn\'t generate the stupid card. Please try again later!' 
      }, { quoted: mek });
    }
  }
};
