import axios from 'axios';

export default {
  name: 'animenews',
  alias: ['newsanime'],
  description: '📰 Donne les dernières actualités d’anime',
  category: 'Anime',
  ownerOnly: false,

  async execute(sock, m, from) {
    const targetChat = from || m.chat;
    try {
      const res = await axios.get('https://api.jikan.moe/v4/anime/1/news', { timeout: 10000 });
      const newsData = res.data?.data;

      if (!newsData || newsData.length === 0) {
        return sock.sendMessage(targetChat, {
          text: `❌ Aucune actualité trouvée pour le moment.`,
        }, { quoted: m });
      }

      const newsList = newsData.slice(0, 5).map((item, index) => {
        const title = item.title || 'Sans titre';
        const link = item.url || '';
        const date = item.date
          ? new Date(item.date).toLocaleDateString('fr-FR')
          : 'Inconnue';
        return `📰 ${index + 1}. *${title}*\n📅 ${date}\n🔗 ${link}`;
      }).join('\n\n');

      await sock.sendMessage(
        targetChat,
        { text: `✨ *Dernières actualités Anime* ✨\n\n${newsList}` },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ animeNews error:', err.message);
      await sock.sendMessage(
        targetChat,
        { text: '❌ Impossible de récupérer les actualités. Essaie encore plus tard.' },
        { quoted: m }
      );
    }
  }
};
