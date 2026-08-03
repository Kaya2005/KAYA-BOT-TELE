import fs from 'fs';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { getBotName, sendWithBotImage, getLocalBotImagePath } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
    name: 'botimage',
    alias: ['setbotimage', 'changeimage'],
    description: 'Modifie l\'image de votre propre bot en répondant à une image',
    category: 'System',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user.id.split(':')[0];
            const botName = getBotName(ownerId);
            const quoted = mek.quoted;
            const isQuotedImage = quoted && (quoted.mtype === 'imageMessage' || quoted.type === 'imageMessage');

            if (!isQuotedImage) {
                const text = `❌ Veuillez répondre à une **image** avec la commande :\n*${prefix}botimage*`;
                return await kaya.sendMessage(from, { text }, { quoted: mek });
            }

            await kaya.sendMessage(from, { text: "⏳ Téléchargement et mise à jour de votre image personnalisée..." }, { quoted: mek });

            const stream = await downloadMediaMessage(
                { message: { imageMessage: quoted } }, 
                'buffer', 
                {}, 
                { logger: console }
            );

            if (!stream) {
                return await kaya.sendMessage(from, { text: "❌ Échec du téléchargement de l'image." }, { quoted: mek });
            }

            // Récupère le chemin spécifique de l'utilisateur et sauvegarde l'image
            const userImagePath = getLocalBotImagePath(ownerId);
            fs.writeFileSync(userImagePath, stream);

            const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*✅ IMAGE MISE À JOUR*\n*➡️ Votre nouvelle image de bot a été enregistrée avec succès !*`;

            return await sendWithBotImage(kaya, from, ownerId, { caption, contextInfo: getContextInfo(ownerId) });

        } catch (err) {
            console.error('❌ botimage.js error:', err);
            return await kaya.sendMessage(from, { text: `❌ Une erreur est survenue : ${err.message}` }, { quoted: mek });
        }
    }
};
