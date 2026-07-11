// report.js
import { getBotName } from '../setting/botAssets.js';

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
      const sender = mek.sender;
      const botName = getBotName(sender);
      const uptime = formatUptime(process.uptime() * 1000);

      // Sécurisation de l'accès au store
      const store = kaya.store || {};
      const chats = store.chats ? Object.entries(store.chats.all()) : [];
      const totalChats = chats.length;

      // Sécurisation de la base de données
      const db = global.db?.data || {};
      const groups = chats.filter(([jid]) => jid.endsWith('@g.us'));
      const privates = chats.filter(([jid]) => !jid.endsWith('@g.us'));
      const contactsCount = Object.keys(db.users || {}).length;

      // Calcul des stats messages avec fallback sécurisé
      const chatStats = chats.map(([jid, chat]) => ({
        name: chat.name || jid.split('@')[0] || "Unknown",
        jid,
        count: db.chats?.[jid]?.messages?.length || 0
      }));

      const getTop = (arr) => arr.sort((a, b) => b.count - a.count).slice(0, 5)
        .map(c => `   • ${c.name.substring(0, 15)} : ${c.count} msg`).join('\n') || '   • Aucune donnée';

      const topGroups = getTop(chatStats.filter(c => c.jid.endsWith('@g.us')));
      const topPrivates = getTop(chatStats.filter(c => !c.jid.endsWith('@g.us')));

      const message = `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
📊 *WHATSAPP ANALYTICS*

⏱️ *Uptime:* ${uptime}
👥 *Stats Globales:*
   • Total chats : ${totalChats}
   • Groupes : ${groups.length}
   • Privés : ${privates.length}
📇 *Contacts enregistrés:* ${contactsCount}

🔥 *Top 5 Groupes Actifs:*
${topGroups}

💌 *Top 5 Contacts Actifs:*
${topPrivates}

▰▰▰▰▰▰▰▰▰▰▰▰▰
*💡 Analyse générée en temps réel.*
`.trim();

      await kaya.sendMessage(from, { text: message }, { quoted: mek });

    } catch (err) {
      console.error('❌ Report error:', err);
      await kaya.sendMessage(from, { text: `❌ Unable to generate WhatsApp report: ${err.message}` }, { quoted: mek });
    }
  }
};
