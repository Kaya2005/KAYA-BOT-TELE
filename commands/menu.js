// ==================== commands/menu.js ====================
import fs from 'fs';
import path from 'path';
import { getContextInfo } from '../setting/contextInfo.js';
import { getBotName, sendWithBotImage, BOT_VERSION } from '../setting/botAssets.js'; // 👈 Import de BOT_VERSION

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

// 🎨 En-tête avec l'owner, le préfixe, le nombre de commandes et la version
function buildHeader({ user, prefix, totalCmds, botName }) {
        return `
> ╭────↯
> │ ➠ *𝙾𝚆𝙽𝙴𝚁:* ${user}
> │ ➠ *𝙿𝚁𝙴𝙵𝙸𝚇:* ${prefix || 'Sans préfixe'}
> │ ➠ *𝙲𝙼𝙳𝚂:* ${totalCmds}
> │ ➠ *𝚅𝙴𝚁𝚂𝙸𝙾𝙽:* v${BOT_VERSION}
> ╰────↯

`.trim();
}

function buildMenuCategoryText({ cat, cmds = [], prefix }) {
    if (!cmds.length) return '';

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

            const baseContext = getContextInfo(mek.sender);

            // Envoi de l'image avec le texte mis à jour
            await sendWithBotImage(
                kaya, 
                from, 
                ownerId, 
                { 
                    caption: finalMenuText, 
                    contextInfo: { 
                        ...baseContext, 
                        mentionedJid: [userId] 
                    } 
                }, 
                { quoted: mek }
            );

        } catch (err) {
            console.error('❌ Erreur dans menu.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ Une erreur est survenue lors de la génération du menu.' }, { quoted: mek });
        }
    }
};
