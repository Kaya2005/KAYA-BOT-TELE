const newsletters = [
  {
    jid: '120363430001047966@newsletter'
  },
  {
    jid: '120363431452607467@newsletter'
  }
];

export function getContextInfo() {
  const newsletter = newsletters[Math.floor(Math.random() * newsletters.length)];

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
