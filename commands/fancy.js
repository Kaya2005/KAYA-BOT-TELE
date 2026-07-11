import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { applyStyle, getStyleList } from '../setting/fancyStyles.js';

export default {
  name: 'fancy',
  description: '🎨 Transforme le texte avec 50 styles.',
  category: 'General',
  usage: '.fancy <1-50> <texte>',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const styleNum = parseInt(args[0]);
      const content = args.slice(1).join(' ');

      // 1. Si aucun numéro n'est fourni ou si c'est invalide, affiche la liste
      if (!args[0] || isNaN(styleNum)) {
        return await kaya.sendMessage(from, { text: getStyleList() }, { quoted: mek });
      }

      // 2. Si le texte manque ou le numéro est hors limite, affiche l'aide
      if (!content || styleNum > 50 || styleNum < 1) {
        return await sendWithBotImage(kaya, from, sender, { 
            caption: `▉ \`${getBotName(sender)}\` ▉\n\n*Usage:* \`${prefix}fancy <1-50> <texte>\`\n*Total:* 50 styles configurés.` 
        });
      }

      // 3. Applique le style et envoie le résultat
      const result = applyStyle(content, styleNum);
      return await kaya.sendMessage(from, { text: `✨ *Résultat:*\n\n${result}` }, { quoted: mek });

    } catch (err) {
      console.error('❌ fancy.js error:', err);
      await kaya.sendMessage(from, { text: 'Une erreur est survenue lors de la transformation du texte.' }, { quoted: mek });
    }
  }
};
