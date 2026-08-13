// menu.js
import fs from 'fs';
import path from 'path';
import { getContextInfo } from '../setting/contextInfo.js';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

// Stockage des sessions par chat
global.menuSessions = global.menuSessions || new Map();
const MAX_SESSIONS = 300;

function pad(n) { return String(n).padStart(2, '0'); }
function getTime() { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function getDate() { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${pad(d.getFullYear())}`; }

/**
 * 🔤 Convertit un texte normal en police grasse mathématique (ex: MENU -> 𝐌𝐄𝐍𝐔)
 */
function toBold(text) {
    return text.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) { // A-Z
            return String.fromCodePoint(code + 119743);
        }
        if (code >= 97 && code <= 122) { // a-z
            return String.fromCodePoint(code + 119737);
        }
        return char;
    }).join('');
}

function readdirSyncSafely(dir) {
    if (fs.existsSync(dir)) {
        return fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    }
    return [];
}

/**
 * 📂 Charge dynamiquement toutes les catégories et commandes du bot
 */
async function loadAllCategories() {
    const commandsDir = path.join(process.cwd(), 'commands');
    const categories = {};

    if (fs.existsSync(commandsDir)) {
        const files = readdirSyncSafely(commandsDir);
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
                console.error(`Erreur chargement ${file}:`, e);
            }
        }
    }

    const sortedCats = Object.keys(categories).sort(
        (a, b) => categories[b].length - categories[a].length
    );

    return { categories, sortedCats };
}

/**
 * 🛠️ Gère l'interactivité : Reply avec un chiffre OU raccourci direct (ex: generalmenu)
 */
export async function handleMenuInteraction(kaya, mek, from, args, prefix) {
    try {
        const rawText = mek.text || (args && args.join(' ')) || '';
        if (!rawText) return false;

        // Nettoyage du texte pour analyser les raccourcis (ex: "!groupmenu" -> "groupmenu")
        const cleanText = rawText.trim().toLowerCase().replace(/^[^\w]/, '').replace(/\s+/g, '');

        // 1️⃣ CAS DES RACCOURCIS DIRECTS (ex: generalmenu, groupmenu...)
        if (cleanText.endsWith('menu') && cleanText.length > 4) {
            const queryCat = cleanText.replace('menu', '');
            const { categories, sortedCats } = await loadAllCategories();

            // Recherche de la catégorie correspondante
            const foundCat = sortedCats.find(cat => cat.toLowerCase().replace(/\s+/g, '') === queryCat);

            if (foundCat) {
                const cmds = categories[foundCat];
                const categoryTitle = toBold(`${foundCat} MENU`);
                const categoryText = `
> ╢ ${categoryTitle} ♰
╭▰▰▰▰▰▰▰◈
${cmds.map(c => `┆❏ ${prefix || ''}${toBold(c)}`).join('\n')}
╰▰▰▰▰▰▰▰◈
`.trim();

                await kaya.sendMessage(from, { text: categoryText }, { quoted: mek });
                return true;
            }
        }

        // 2️⃣ CAS DU REPLY AU MENU PRINCIPAL AVEC UN CHIFFRE
        if (global.menuSessions && global.menuSessions.has(from)) {
            const sessionData = global.menuSessions.get(from);
            const quotedMessageId = mek.message?.extendedTextMessage?.contextInfo?.stanzaId;

            if (quotedMessageId && quotedMessageId === sessionData.menuMessageId) {
                const choice = parseInt(rawText.trim());

                if (!isNaN(choice) && choice > 0 && choice <= sessionData.sortedCats.length) {
                    const selectedCat = sessionData.sortedCats[choice - 1];
                    const cmds = sessionData.categories[selectedCat];
                    const currentPrefix = sessionData.prefix;

                    const categoryTitle = toBold(`${selectedCat} MENU`);
                    const categoryText = `
> ╢ ${categoryTitle} ♰
╭▰▰▰▰▰▰▰◈
${cmds.map(c => `┆❏ ${currentPrefix}${toBold(c)}`).join('\n')}
╰▰▰▰▰▰▰▰◈
`.trim();

                    await kaya.sendMessage(from, { text: categoryText }, { quoted: mek });
                    return true;
                }
            }
        }
    } catch (e) {
        console.error('❌ Erreur dans handleMenuInteraction :', e);
    }
    return false;
}

export default {
    name: 'menu',
    category: 'General',
    description: 'Affiche le menu interactif par catégories.',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const userId = mek.sender;
            const userNumber = userId.split('@')[0];
            const userMention = `@${userNumber}`;
            const botName = getBotName(userId);

            const { categories, sortedCats } = await loadAllCategories();

            // Gestion de la limite de mémoire (FIFO)
            if (global.menuSessions.size >= MAX_SESSIONS) {
                const oldestKey = global.menuSessions.keys().next().value;
                global.menuSessions.delete(oldestKey);
            }

            let categoryListText = '';
            sortedCats.forEach((cat, index) => {
                const formattedCatName = toBold(`${cat} MENU`);
                categoryListText += `*${index + 1}.* 📁 ${formattedCatName} (${categories[cat].length} cmds)\n`;
            });

            const mainText = `
▉ \`${botName}\` - MENU PRINCIPAL ▉
▰▰▰▰▰▰▰▰▰▰
➠ User: *${userMention}*
➠ Prefix: *[ ${prefix || 'Sans préfixe'} ]*
➠ Time: *${getTime()}* | Date: *${getDate()}*
______________________

> 💡 *Répondez (Reply) avec un chiffre ou tapez directement (ex: generalmenu)*

${categoryListText.trim()}
`.trim();

            const sentMsg = await sendWithBotImage(kaya, from, userId, { 
                caption: mainText, 
                contextInfo: { ...getContextInfo(userId), mentionedJid: [userId] } 
            });

            const menuMessageId = sentMsg?.key?.id || sentMsg?.id;

            global.menuSessions.set(from, {
                categories,
                sortedCats,
                prefix,
                menuMessageId
            });

        } catch (err) {
            console.error('❌ Erreur dans menu.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ Une erreur est survenue lors de la génération du menu.' }, { quoted: mek });
        }
    }
};
