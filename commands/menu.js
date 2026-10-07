// ==================== commands/menu.js ====================
import fs from 'fs';
import path from 'path';
import { getContextInfo } from '../setting/contextInfo.js';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

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
          ◈┈▉ \`${botName}\` ▉┄◈
> ╭────↯
> │ ➠ *𝙾𝚆𝙽𝙴𝚁:* ${user}
> │ ➠ *𝙿𝚁𝙴𝙵𝙸𝚇:* ${prefix || 'Sans préfixe'}
> │ ➠ *𝚃𝙾𝚃𝙰𝙻 𝙲𝙼𝙳𝚂:* ${totalCmds}
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

            await sendWithBotImage(kaya, from, mek.sender, { 
                caption: finalMenuText, 
                contextInfo: { ...getContextInfo(mek.sender), mentionedJid: [userId] } 
            });

        } catch (err) {
            console.error('❌ Erreur dans menu.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ Une erreur est survenue lors de la génération du menu.' }, { quoted: mek });
        }
    }
};
