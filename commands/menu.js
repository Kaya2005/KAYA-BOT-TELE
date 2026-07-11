import fs from 'fs';
import path from 'path';
import { getContextInfo } from '../setting/contextInfo.js';
import { getBotName } from '../setting/botAssets.js'; // getBotName gère maintenant le 'from'

function pad(n) { return String(n).padStart(2, '0'); }

function getTime() {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getDate() {
    const d = new Date();
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${pad(d.getFullYear())}`;
}

function buildHeader({ user, prefix, totalCmds, botName }) {
    return `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰
➠ User: *${user}*
➠ Prefix: *[ ${prefix || 'Sans préfixe'} ]*
➠ Total Cmds: *${totalCmds}*
➠ Time: *${getTime()}*
➠ Date: *${getDate()}*
______________________
`.trim();
}

function buildMenuCategoryText({ cat, cmds = [], prefix }) {
    if (!cmds.length) return '';

    return `
> ╢ ${cat.toUpperCase()} ♰
╭▰▰▰▰▰▰▰◈
${cmds.map(c => `┆❏ ${prefix}${c.toLowerCase()}`).join('\n')}
╰▰▰▰▰▰▰▰◈
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
            
            // Récupération du nom dynamique pour ce groupe
            const botName = getBotName(from);

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

            let thumbnailBuffer = null;
            const localImagePath = path.join(process.cwd(), 'setting', 'bot.jpg');
            if (fs.existsSync(localImagePath)) {
                thumbnailBuffer = fs.readFileSync(localImagePath);
            }

            const externalAdReply = {
                title: `WELCOME TO ${botName.toUpperCase()}`, 
                body: `${totalCmds} COMMANDS AVAILABLE`,
                mediaType: 1,
                renderLargerThumbnail: true,
                showAdAttribution: true,
                thumbnail: thumbnailBuffer
            };

            const contextInfo = {
                ...getContextInfo(),
                externalAdReply,
                mentionedJid: [userId]
            };

            await kaya.sendMessage(from, { text: finalMenuText, contextInfo }, { quoted: mek });

        } catch (err) {
            console.error('❌ Erreur dans menu.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ Une erreur est survenue lors de la génération du menu.' }, { quoted: mek });
        }
    }
};
