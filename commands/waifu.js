import fetch from "node-fetch";
import db from '#db';

export default {
  name: ['waifu', 'neko'],
  category: 'anime',
  description: 'Obtener una imagen de waifu aleatoria.',

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Réaction de chargement
      await kaya.sendMessage(from, { react: { text: '🕒', key: mek.key } });

      const chat = db.getChat(from);
      let mode = chat?.nsfw ? 'nsfw' : 'sfw';

      // Extraction dynamique de la commande (waifu ou neko)
      const body = mek.text || mek.message?.conversation || mek.message?.extendedTextMessage?.text || '';
      const textWithoutPrefix = body.startsWith(prefix) ? body.slice(prefix.length) : body;
      const command = textWithoutPrefix.trim().split(' ')[0].toLowerCase();

      let url = `https://nekos.best/api/v2/${command}${mode === 'nsfw' ? '?type=nsfw' : ''}`;
      let res = await fetch(url);
      if (!res.ok) return;

      let json = await res.json();
      if (!json.results?.[0]?.url) return;

      let img = Buffer.from(await (await fetch(json.results[0].url)).arrayBuffer());
      const caption = `✿ ¡Aquí tienes tu *${command.toUpperCase()}*!`;

      // Envoi de l'image
      await kaya.sendMessage(from, { 
        image: img, 
        caption 
      }, { quoted: mek });

      // Réaction de succès
      await kaya.sendMessage(from, { react: { text: '✔️', key: mek.key } });

    } catch (e) {
      console.error('❌ Waifu/Neko error:', e);
      await kaya.sendMessage(from, { react: { text: '✖️', key: mek.key } });

      const body = mek.text || mek.message?.conversation || mek.message?.extendedTextMessage?.text || '';
      const command = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(' ')[0] : 'waifu';

      await kaya.sendMessage(from, { 
        text: `> Ocurrió un error inesperado al ejecutar el comando *${prefix + command}*.\n> [Error: *${e.message}*]` 
      }, { quoted: mek });
    }
  },
};
