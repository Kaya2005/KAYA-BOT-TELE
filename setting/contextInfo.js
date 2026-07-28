// setting/contextInfo.js (ou le chemin où se trouve votre fichier)
import { getBotName } from './botAssets.js';

const newsletters = [
  {
    jid: '120363430001047966@newsletter'
  },
  {
    jid: '120363430001047966@newsletter'
  }
];

export function getContextInfo(sender = null) {
  // Récupère le nom personnalisé du bot si un sender est fourni, sinon utilise un nom par défaut
  const botName = sender ? getBotName(sender) : '𝐊𝐀𝐘𝐀 𝐁𝐎𝐓';
  const newsletter = newsletters[Math.floor(Math.random() * newsletters.length)];

  return {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: newsletter.jid,
      newsletterName: botName, // Utilise le nom dynamique ici
      serverMessageId: 150
    }
  };
}
