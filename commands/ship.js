import { getBotName } from '../setting/botAssets.js';
import decodeJid from '../setting/decodeJid.js';

export default {
  name: 'ship',
  alias: ['love', 'romance'],
  category: 'Fun',
  description: '💖 Ship deux membres avec un pourcentage d’amour',
  group: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender); // Nom personnalisé par utilisateur
      const metadata = await kaya.groupMetadata(from);
      const participants = metadata.participants.map(p => decodeJid(p.id));

      if (participants.length < 2) {
        return await kaya.sendMessage(from, { text: '⚠️ Pas assez de membres pour faire un ship.' }, { quoted: mek });
      }

      let user1, user2;

      // 🔹 Gestion des mentions et des quotes
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const quotedSender = mek.message?.extendedTextMessage?.contextInfo?.participant;

      if (mentioned.length >= 2) {
        user1 = decodeJid(mentioned[0]);
        user2 = decodeJid(mentioned[1]);
      } else if (mentioned.length === 1 && quotedSender) {
        user1 = decodeJid(mentioned[0]);
        user2 = decodeJid(quotedSender);
      } else {
        user1 = participants[Math.floor(Math.random() * participants.length)];
        do {
          user2 = participants[Math.floor(Math.random() * participants.length)];
        } while (user2 === user1);
      }

      // ❤️ Pourcentage et barre
      const percent = Math.floor(Math.random() * 101);
      const barLength = 10;
      const filled = Math.round((percent / 100) * barLength);
      const bar = '❤️'.repeat(filled) + '🤍'.repeat(barLength - filled);

      const message = `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
💘 *SHIP MATCH* 💘

@${user1.split('@')[0]} ❤️ @${user2.split('@')[0]}

💞 *Compatibilité:* ${bar} *${percent}%*

✨ ${percent > 80 ? 'Couple parfait 💍' : percent > 60 ? 'Très bonne alchimie 😍' : percent > 40 ? 'Ça peut marcher 😉' : percent > 20 ? 'Relation compliquée 😅' : 'Mieux vaut rester amis 😬'}
`.trim();

      return await kaya.sendMessage(from, {
        text: message,
        mentions: [user1, user2]
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ ship.js error:', err);
      return await kaya.sendMessage(from, { text: '❌ Erreur lors du ship.' }, { quoted: mek });
    }
  }
};
