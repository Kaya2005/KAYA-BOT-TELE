import fetch from "node-fetch";

export default {
  name: ['ppcp', 'ppcouple'],
  category: 'anime',
  description: 'Generar imágenes para amistades o parejas.',

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Réaction de chargement
      await kaya.sendMessage(from, { react: { text: '🕒', key: mek.key } });

      let data = await (await fetch('https://raw.githubusercontent.com/ShirokamiRyzen/WAbot-DB/main/fitur_db/ppcp.json')).json();
      let cita = data[Math.floor(Math.random() * data.length)];

      // Image masculine
      let cowi = Buffer.from(await (await fetch(cita.cowo)).arrayBuffer());
      await kaya.sendMessage(from, { 
        image: cowi, 
        caption: '*Masculino* ♂' 
      }, { quoted: mek });

      // Image féminine
      let ciwi = Buffer.from(await (await fetch(cita.cewe)).arrayBuffer());
      await kaya.sendMessage(from, { 
        image: ciwi, 
        caption: '*Femenina* ♀' 
      }, { quoted: mek });

      // Réaction de succès
      await kaya.sendMessage(from, { react: { text: '✔️', key: mek.key } });

    } catch (e) {
      console.error('❌ PPCP error:', e);
      await kaya.sendMessage(from, { react: { text: '✖️', key: mek.key } });

      const body = mek.text || mek.message?.conversation || mek.message?.extendedTextMessage?.text || '';
      const command = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(' ')[0] : 'ppcp';

      await kaya.sendMessage(from, { 
        text: `> Ocurrió un error inesperado al ejecutar el comando *${prefix + command}*.\n> [Error: *${e.message}*]` 
      }, { quoted: mek });
    }
  },
};
