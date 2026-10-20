const newsletters = [
  {
    jid: '120363430001047966@newsletter'
  },
  {
    jid: '120363430001047966@newsletter'
  }
];

// Compteur d'alternance strict
let currentIndex = 0;

export function getContextInfo() {
  // Sélectionne la chaîne courante et passe à la suivante
  const newsletter = newsletters[currentIndex];
  currentIndex = (currentIndex + 1) % newsletters.length;

  return {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: newsletter.jid,
      newsletterName: 'ƘƛƳƛ ƁƠƬ',
      serverMessageId: 150
    }
  };
}
