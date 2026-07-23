const newsletters = [
  {
    jid: '120363430001047966@newsletter',
    name: '𝐊𝐀𝐘𝐀 𝐁𝐎𝐓'
  },
  {
    jid: '120363430001047966@newsletter',
    name: '𝐊𝐀𝐘𝐀 𝐁𝐎𝐓'
  }
];

export function getContextInfo() {
  const newsletter = newsletters[Math.floor(Math.random() * newsletters.length)];

  return {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: newsletter.jid,
      newsletterName: newsletter.name,
      serverMessageId: 150
    }
  };
}