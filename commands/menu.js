// ==================== menu.js ====================

import fs from "fs";
import path from "path";

import {
    getContextInfo
} from "../setting/contextInfo.js";

import {
    getBotName,
    sendWithBotImage
} from "../setting/botAssets.js";


// ==========================================
// MENUS ACTIFS (Basés sur l'ID du message)
// ==========================================

const activeMenus = new Map();
const MENU_TIMEOUT = 5 * 60 * 1000;


// ==========================================
// UTILITAIRES
// ==========================================

function pad(n) {
    return String(n).padStart(2, "0");
}

function getTime() {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getDate() {
    const d = new Date();
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function getDayName() {
    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];
    return days[new Date().getDay()];
}


// ==========================================
// HEADER
// ==========================================

function buildHeader({
    user,
    prefix,
    totalCmds,
    botName
}) {
    return `
> ╭┈▉ \`${botName}\` ▉┄◈
> ┆ ╭────↯
> ┆ │ ➠ *𝙾𝚆𝙽𝙴𝚁:* ${user}
> ┆ │ ➠ *𝙿𝚁𝙴𝙵𝙸𝚇:* ${prefix || "Sans préfixe"}
> ┆ │ ➠ *𝚃𝙾𝙳𝙰𝚈:* ${getDayName()}
> ┆ │ ➠ *𝙳𝙰𝚃𝙴:* ${getDate()}
> ┆ │ ➠ *𝚃𝙸𝙼𝙴:* ${getTime()}
> ┆ │ ➠ *𝚃𝙾𝚃𝙰𝙻 𝙲𝙼𝙳𝚂:* ${totalCmds}
> ┆ ╰────↯
> ╰┄┄┄┄┄┄┄┄┄┄┄┄┄◈
`.trim();
}


// ==========================================
// CHARGER LES CATÉGORIES
// ==========================================

async function loadCategories() {
    const commandsDir = path.join(
        process.cwd(),
        "commands"
    );

    const categories = {};

    if (!fs.existsSync(commandsDir)) {
        return categories;
    }

    const files = fs.readdirSync(commandsDir)
        .filter(file => file.endsWith(".js"));

    for (const file of files) {
        try {
            const filePath = path.join(
                commandsDir,
                file
            );

            const cmd = await import(
                `file://${filePath}`
            );

            const command =
                cmd.default || cmd;

            if (!command?.name) {
                continue;
            }

            const category = (
                command.category ||
                "General"
            ).toUpperCase();

            if (!categories[category]) {
                categories[category] = [];
            }

            const commandName =
                command.name.toLowerCase();

            if (
                !categories[category]
                    .includes(commandName)
            ) {
                categories[category].push(commandName);
            }

        } catch (error) {
            console.error(
                `Erreur lors du chargement de ${file} dans menu.js :`,
                error
            );
        }
    }

    return categories;
}


// ==========================================
// NETTOYER LES MENUS EXPIRÉS
// ==========================================

function cleanExpiredMenus() {
    const now = Date.now();
    for (const [msgId, menu] of activeMenus.entries()) {
        if (now - menu.createdAt > MENU_TIMEOUT) {
            activeMenus.delete(msgId);
        }
    }
}


// ==========================================
// ENVOYER LE MENU AVEC IMAGE
// ==========================================

async function sendMenuImage(
    kaya,
    from,
    sender,
    caption
) {
    return await sendWithBotImage(
        kaya,
        from,
        sender,
        {
            caption,

            contextInfo: {
                ...getContextInfo(sender),
                mentionedJid: [sender]
            }
        }
    );
}


// ==========================================
// MENU PRINCIPAL
// ==========================================

function buildMainMenu({
    user,
    prefix,
    botName,
    sortedCategories,
    totalCmds
}) {
    let text = buildHeader({
        user,
        prefix,
        totalCmds,
        botName
    });

    text += `\n\n> ╢ *MENU PRINCIPAL* ♰`;
    text += `\n╭▰▰▰▰▰▰▰▰◈`;

    sortedCategories.forEach(
        (category, index) => {
            text += `\n┆ ➠ *${index + 1}.* ${category}`;
        }
    );

    text += `\n╰▰▰▰▰▰▰▰◈`;
    text += `\n\n> ✦ *Répondez avec le numéro de votre choix.*`;
    text += `\n> ✦ Exemple : *1*`;

    return text;
}


// ==========================================
// MENU CATÉGORIE
// ==========================================

function buildCategoryMenu({
    category,
    commands,
    prefix,
    botName
}) {
    if (!commands || commands.length === 0) {
        return `
> ╭┈▉ \`${botName}\` ▉┄◈
> ┆ ╢ *${category} MENU* ♰
> ╰┄┄┄┄┄┄┄┄┄┄┄┄┄◈

> ⚠️ Aucune commande trouvée.

> ✦ Répondez avec *menu* pour revenir.
`.trim();
    }

    const commandList = commands
        .map(
            command =>
                `┆ ➠ ${prefix}${command}`
        )
        .join("\n");

    return `
> ╭┈▉ \`${botName}\` ▉┄◈
> ┆ ╢ *${category} MENU* ♰
> ╰┄┄┄┄┄┄┄┄┄┄┄┄┄◈

╭▰▰▰▰▰▰▰▰◈
${commandList}
╰▰▰▰▰▰▰▰◈

> ✦ Répondez avec *menu* pour revenir.
`.trim();
}


// ==========================================
// RÉCUPÉRER L'ID DU MESSAGE CITÉ
// ==========================================

function getQuotedMessageId(mek) {
    try {
        const msg = mek?.message;
        if (!msg) return null;

        const contextInfo =
            msg.extendedTextMessage?.contextInfo ||
            msg.imageMessage?.contextInfo ||
            msg.videoMessage?.contextInfo ||
            msg.documentMessage?.contextInfo ||
            msg.audioMessage?.contextInfo ||
            msg.ephemeralMessage?.message?.extendedTextMessage?.contextInfo ||
            msg.ephemeralMessage?.message?.imageMessage?.contextInfo ||
            msg.viewOnceMessage?.message?.extendedTextMessage?.contextInfo ||
            msg.viewOnceMessage?.message?.imageMessage?.contextInfo ||
            msg.viewOnceMessageV2?.message?.extendedTextMessage?.contextInfo ||
            msg.viewOnceMessageV2?.message?.imageMessage?.contextInfo;

        return (
            contextInfo?.stanzaId ||
            contextInfo?.quotedMessage?.key?.id ||
            null
        );
    } catch {
        return null;
    }
}


// ==========================================
// AFFICHER LE MENU PRINCIPAL
// ==========================================

async function showMainMenu(
    kaya,
    mek,
    from,
    prefix
) {
    cleanExpiredMenus();

    const userId = mek.sender;
    const userNumber = userId.split("@")[0];
    const userMention = `@${userNumber}`;
    const botName = getBotName(userId);

    const categories = await loadCategories();

    const sortedCategories =
        Object.keys(categories)
            .sort(
                (a, b) =>
                    categories[b].length -
                    categories[a].length
            );

    const totalCmds =
        Object.values(categories)
            .reduce(
                (total, commands) =>
                    total + commands.length,
                0
            );

    const menuText =
        buildMainMenu({
            user: userMention,
            prefix,
            botName,
            sortedCategories,
            totalCmds
        });

    const sentMessage = await sendMenuImage(
        kaya,
        from,
        userId,
        menuText
    );

    const messageId = sentMessage?.key?.id;

    if (messageId) {
        activeMenus.set(
            messageId,
            {
                categories,
                sortedCategories,
                prefix,
                createdAt: Date.now()
            }
        );
    }
}


// ==========================================
// DÉTECTION DES RÉPONSES (UNIQUEMENT PAR CITATION)
// ==========================================

export async function handleMenuReply(
    kaya,
    mek,
    from,
    text
) {
    try {
        if (!mek?.sender) {
            return false;
        }

        if (!text) {
            return false;
        }

        cleanExpiredMenus();

        // Vérifie si l'utilisateur répond explicitement à un message du bot
        const quotedId = getQuotedMessageId(mek);
        if (!quotedId) {
            return false;
        }

        const activeMenu = activeMenus.get(quotedId);
        if (!activeMenu) {
            return false;
        }

        const userId = mek.sender;
        const message = String(text).trim();


        // ======================================
        // RETOUR AU MENU PRINCIPAL
        // ======================================

        if (
            message.toLowerCase() ===
            "menu"
        ) {
            await showMainMenu(
                kaya,
                mek,
                from,
                activeMenu.prefix
            );

            return true;
        }


        // ======================================
        // UNIQUEMENT LES NUMÉROS
        // ======================================

        if (!/^\d+$/.test(message)) {
            return false;
        }

        const number = Number(message);


        // ======================================
        // NUMÉRO INVALIDE
        // ======================================

        if (
            number < 1 ||
            number >
                activeMenu
                    .sortedCategories
                    .length
        ) {
            await kaya.sendMessage(
                from,
                {
                    text:
                        `⚠️ *Choix invalide.*\n\n` +
                        `Veuillez choisir un numéro entre *1* et *${activeMenu.sortedCategories.length}*.`
                },
                {
                    quoted: mek
                }
            );

            return true;
        }


        // ======================================
        // CATÉGORIE
        // ======================================

        const category =
            activeMenu
                .sortedCategories[
                    number - 1
                ];

        const commands =
            activeMenu
                .categories[
                    category
                ] || [];

        const botName =
            getBotName(userId);


        // ======================================
        // CONSTRUIRE LE MENU DE LA CATÉGORIE
        // ======================================

        const categoryText =
            buildCategoryMenu({
                category,
                commands,
                prefix: activeMenu.prefix,
                botName
            });


        // ======================================
        // ENVOYER ET ENREGISTRER LE NOUVEL ID
        // ======================================

        const sentCategory = await sendMenuImage(
            kaya,
            from,
            userId,
            categoryText
        );

        const newMsgId = sentCategory?.key?.id;

        if (newMsgId) {
            activeMenus.set(
                newMsgId,
                {
                    categories: activeMenu.categories,
                    sortedCategories: activeMenu.sortedCategories,
                    prefix: activeMenu.prefix,
                    createdAt: Date.now()
                }
            );
        }

        return true;

    } catch (error) {
        console.error(
            "❌ Erreur handleMenuReply :",
            error
        );

        return false;
    }
}


// ==========================================
// COMMANDE MENU
// ==========================================

export default {

    name: "menu",

    category: "General",

    description:
        "Affiche le menu interactif.",

    async execute(
        kaya,
        mek,
        from,
        args,
        prefix
    ) {
        try {
            await showMainMenu(
                kaya,
                mek,
                from,
                prefix
            );
        } catch (error) {
            console.error(
                "❌ Erreur dans menu.js :",
                error
            );

            await kaya.sendMessage(
                from,
                {
                    text:
                        "⚠️ Une erreur est survenue lors de la génération du menu."
                },
                {
                    quoted: mek
                }
            );
        }
    }
};
