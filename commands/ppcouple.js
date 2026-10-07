import fetch from "node-fetch";
import { boxMessage, errorBox } from '../setting/theme.js';

export default {
  name: 'ppcp',
  aliases: ['ppcouple'],
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
      const maleCaption = boxMessage('Matching Couple', '*Masculino* ♂', '🧑');
      await kaya.sendMessage(from, { 
        image: cowi, 
        caption: maleCaption 
      }, { quoted: mek });

      // Image féminine
      let ciwi = Buffer.from(await (await fetch(cita.cewe)).arrayBuffer());
      const femaleCaption = boxMessage('Matching Couple', '*Femenina* ♀', '👩');
      await kaya.sendMessage(from, { 
        image: ciwi, 
        caption: femaleCaption 
      }, { quoted: mek });

      // Réaction de succès
      await kaya.sendMessage(from, { react: { text: '✔️', key: mek.key } });

    } catch (e) {
      console.error('❌ PPCP error:', e);
      await kaya.sendMessage(from, { react: { text: '✖️', key: mek.key } });

      const body = mek.text || mek.message?.conversation || mek.message?.extendedTextMessage?.text || '';
      const command = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(' ')[0] : 'ppcp';

      const errorText = `Ocurrió un error inesperado al ejecutar el comando *${prefix + command}*.\n\nError: ${e.message}`;
      await kaya.sendMessage(from, { 
        text: errorBox(errorText) 
      }, { quoted: mek });
    }
  },
};
