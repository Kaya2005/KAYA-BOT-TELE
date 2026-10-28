// ==================== commands/menu.js ====================
import fs from 'fs';
import path from 'path';
import { getContextInfo } from '../setting/contextInfo.js';
import { getBotName, getLocalBotImagePath } from '../setting/botAssets.js';

// Table de conversion pour transformer le texte standard en sᴍᴀʟʟ ᴄᴀᴘs stylisés
function toSmallCaps(str) {
    const map = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ',
        'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ',
        'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ',
        'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return str.toLowerCase().split('').map(char => map[char] || char).join('');
}

// 🎨 Style avec conservation du préfixe `>` et alignement parfait des encadrés
function buildHeader({ user, prefix, totalCmds, botName }) {
        return `
> ╭────↯
> │ ➠ *𝙾𝚆𝙽𝙴𝚁:* ${user}
> │ ➠ *𝙿𝚁𝙴𝙵𝙸𝚇:* ${prefix || 'Sans préfixe'}
> ╰────↯

`.trim();
}

function buildMenuCategoryText({ cat, cmds = [], prefix }) {
    if (!cmds.length) return '';

    // Transforme la catégorie et "MENU" en police stylisée sᴍᴀʟʟ ᴄᴀᴘs (ex: ɢʀᴏᴜᴘ ᴍᴇɴᴜ)
    const rawCategoryName = `${cat} MENU`;
    const formattedCatName = toSmallCaps(rawCategoryName);

      return `
         ${formattedCatName} 
╭──────────◈
${cmds.map(c => `┆ ◈ ${prefix}${c.toLowerCase()}`).join('\n')}
╰──────────◈
`.trim();
}

export default {
    name: 'menu',
    category: 'General',
    description: 'Affiche la liste complète des commandes.',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const userId = mek.sender;
            const userNumber = userId.split('@')[0];
            const userMention = `@${userNumber}`;
            
            const botName = getBotName(mek.sender);
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : userNumber;

            const commandsDir = path.join(process.cwd(), 'commands');
            const categories = {};

            if (fs.existsSync(commandsDir)) {
                const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

                for (const file of files) {
                    try {
                        const cmd = await import(`file://${path.join(commandsDir, file)}`);
                        const command = cmd.default || cmd;

                        if (!command?.name) continue;

                        const cat = (command.category || 'General').toUpperCase();
                        if (!categories[cat]) categories[cat] = [];

                        if (!categories[cat].includes(command.name.toLowerCase())) {
                            categories[cat].push(command.name.toLowerCase());
                        }
                    } catch (e) {
                        console.error(`Erreur lors du chargement de ${file} dans menu.js :`, e);
                    }
                }
            }

            const sortedCats = Object.keys(categories).sort(
                (a, b) => categories[b].length - categories[a].length
            );

            let menuList = '';
            for (const cat of sortedCats) {
                menuList += buildMenuCategoryText({ cat, cmds: categories[cat], prefix }) + '\n\n';
            }

            const totalCmds = Object.values(categories).reduce((a, b) => a + b.length, 0);

            const finalMenuText = `
${buildHeader({ user: userMention, prefix, totalCmds, botName })}

${menuList.trim()}
`.trim();

            // 🖼️ Récupération de l'image (owner ou défaut) pour l'aperçu sous n'importe quelle taille
            let thumbnailBuffer = undefined;
            try {
                let imgPath = getLocalBotImagePath(ownerId);
                if (!fs.existsSync(imgPath)) {
                    imgPath = getLocalBotImagePath('default') || getLocalBotImagePath();
                }
                if (imgPath && fs.existsSync(imgPath)) {
                    thumbnailBuffer = fs.readFileSync(imgPath);
                }
            } catch (e) {
                console.error("Erreur lecture miniature menu:", e);
            }

            // Définition de l'externalAdReply
            const externalAdReply = {
                title: `WELCOME TO ${botName}`,
                body: `${totalCmds} COMMANDS • v3`,
                mediaType: 1,
                renderLargerThumbnail: true,
                ...(thumbnailBuffer ? { thumbnail: thumbnailBuffer } : {})
            };

            const baseContext = getContextInfo(mek.sender);

            // Envoi d'un message purement textuel avec l'aperçu d'annonce (sans doubler l'image)
            await kaya.sendMessage(from, { 
                text: finalMenuText, 
                contextInfo: { 
                    ...baseContext, 
                    mentionedJid: [userId],
                    externalAdReply: {
                        ...(baseContext?.externalAdReply || {}),
                        ...externalAdReply
                    }
                } 
            }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans menu.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ Une erreur est survenue lors de la génération du menu.' }, { quoted: mek });
        }
    }
};
