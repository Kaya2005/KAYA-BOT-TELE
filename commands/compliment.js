import { getBotName } from '../setting/botAssets.js';

const compliments = [
    "Tu es incroyable tel que tu es !",
    "Tu as un sens de l'humour génial !",
    "Tu es incroyablement attentionné et gentil.",
    "Tu es plus puissant que tu ne le crois.",
    "Tu illumines la pièce !",
    "Tu es un vrai ami.",
    "Tu m'inspires !",
    "Tu es intelligent comme le roi noir Léonidas.",
    "Tu as un cœur en or.",
    "Tu fais une différence dans le monde.",
    "Ta positivité est contagieuse !",
    "Tu as une éthique de travail incroyable.",
    "Tu fais ressortir le meilleur chez les autres.",
    "Ton sourire illumine la journée de tout le monde.",
    "Tu es doué dans tout ce que tu fais.",
    "Ta gentillesse rend le monde meilleur.",
    "Tu as une perspective unique et merveilleuse.",
    "Ton enthousiasme est vraiment inspirant !",
    "Tu es capable d’accomplir de grandes choses.",
    "Tu sais toujours comment rendre quelqu’un spécial.",
    "Ta confiance est admirable.",
    "Tu as une belle âme.",
    "Ta générosité n’a pas de limites.",
    "Tu as un œil exceptionnel pour les détails.",
    "Ta passion est vraiment motivante !",
    "Tu es un(e) auditeur(trice) exceptionnel(le).",
    "Tu es plus fort(e) que tu ne le penses !",
    "Ton rire est contagieux.",
    "Tu as un don naturel pour valoriser les autres.",
    "Tu rends le monde meilleur simplement en étant là."
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

      // 🔹 Déterminer la cible (Mention ou Reply)
      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      const quotedParticipant = mek.message?.extendedTextMessage?.contextInfo?.participant;
      const userToCompliment = mentioned?.[0] || quotedParticipant;

      if (!userToCompliment) {
        const text = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰\n❌ *Usage:* Mentionnez quelqu’un ou répondez à son message pour lui faire un compliment !`;
        return await kaya.sendMessage(from, { text }, { quoted: mek });
      }

      // 🔹 Sélection aléatoire d’un compliment
      const compliment = compliments[Math.floor(Math.random() * compliments.length)];

      // 🔹 Envoi du compliment
      await kaya.sendMessage(from, {
        text: `✨ Hey @${userToCompliment.split('@')[0]}, ${compliment}`,
        mentions: [userToCompliment]
      }, { quoted: mek });

    } catch (error) {
      console.error('❌ Erreur dans la commande compliment :', error);
      await kaya.sendMessage(from, {
        text: '❌ Une erreur est survenue lors de l’envoi du compliment.'
      }, { quoted: mek });
    }
  }
};
