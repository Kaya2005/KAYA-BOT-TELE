// report.js
import { boxMessage, errorBox } from '../setting/theme.js';

function formatUptime(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / (1000 * 60)) % 60;
  const h = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${d}d ${h}h ${m}m ${s}s`;
}

export default {
  name: 'report',
  alias: ['stats', 'analysis', 'whats'],
  category: 'Owner',
  description: 'Detailed analysis of your WhatsApp via the bot (Owner only)',
  usage: '.report',
  ownerOnly: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const uptime = formatUptime(process.uptime() * 1000);

      // Récupération sécurisée depuis le store Baileys
      const store = kaya.store;
      const chats = store?.chats ? Object.values(store.chats.all ? store.chats.all() : store.chats) : [];
      const contacts = store?.contacts ? Object.values(store.contacts) : [];

      const totalChats = chats.length;
      const groups = chats.filter(c => c.id && c.id.endsWith('@g.us'));
      const privates = chats.filter(c => c.id && c.id.endsWith('@s.whatsapp.net'));

      // Analyse des messages depuis le store si disponibles
      const chatStats = chats.map(chat => {
        const jid = chat.id || '';
        const name = chat.subject || chat.name || chat.verifiedName || jid.split('@')[0] || 'Unknown';
        
        // Comptage sécurisé des messages dans le store si présents
        let msgCount = 0;
        if (store?.messages && store.messages[jid]) {
          const msgs = store.messages[jid];
          msgCount = typeof msgs.array === 'function' ? msgs.array().length : (Array.isArray(msgs) ? msgs.length : Object.keys(msgs).length);
        }

        return { name, jid, count: msgCount };
      });

      const getTop = (arr) => arr.sort((a, b) => b.count - a.count).slice(0, 5)
        .map(c => `• ${c.name.substring(0, 15)} (${c.count} msgs)`).join('\n') || '• No activity recorded yet';

      const topGroups = getTop(chatStats.filter(c => c.jid.endsWith('@g.us')));
      const topPrivates = getTop(chatStats.filter(c => c.jid.endsWith('@s.whatsapp.net')));

      const content = `⏱️ *Uptime:* ${uptime}\n\n` +
                      `👥 *Global Stats:*\n` +
                      `• Total Chats: ${totalChats}\n` +
                      `• Groups: ${groups.length}\n` +
                      `• Privates: ${privates.length}\n` +
                      `📇 *Saved Contacts:* ${contacts.length}\n\n` +
                      `🔥 *Top Active Groups:*\n${topGroups}\n\n` +
                      `💌 *Top Active Chats:*\n${topPrivates}`;

      const message = boxMessage('WhatsApp Analytics', content, '📊');

      await kaya.sendMessage(from, { text: message }, { quoted: mek });

    } catch (err) {
      console.error('❌ Report error:', err);
      await kaya.sendMessage(from, { text: errorBox(`Unable to generate report: ${err.message}`) }, { quoted: mek });
    }
  }
};
