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
// MENUS ACTIFS
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

    const commandsDir =
        path.join(
            process.cwd(),
            "commands"
        );

    const categories = {};

    if (!fs.existsSync(commandsDir)) {
        return categories;
    }

    const files =
        fs.readdirSync(commandsDir)
            .filter(
                file =>
                    file.endsWith(".js")
            );

    for (const file of files) {

        try {

            const filePath =
                path.join(
                    commandsDir,
                    file
                );

            const cmd =
                await import(
                    `file://${filePath}`
                );

            const command =
                cmd.default || cmd;

            if (!command?.name) {
                continue;
            }

            const category =
                (
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

                categories[category]
                    .push(commandName);
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

    for (
        const [userId, menu]
        of activeMenus.entries()
    ) {

        if (
            now - menu.createdAt >
            MENU_TIMEOUT
        ) {

            activeMenus.delete(userId);
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

    await sendWithBotImage(
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
    categories,
    sortedCategories,
    totalCmds
}) {

    let text =
        buildHeader({
            user,
            prefix,
            totalCmds,
            botName
        });

    text +=
        `\n\n> ╢ *MENU PRINCIPAL* ♰`;

    text +=
        `\n╭▰▰▰▰▰▰▰▰◈`;

    sortedCategories.forEach(
        (category, index) => {

            text +=
                `\n┆ ➠ *${index + 1}.* ${category}`;
        }
    );

    text +=
        `\n╰▰▰▰▰▰▰▰◈`;

    text +=
        `\n\n> ✦ *Répondez avec le numéro de votre choix.*`;

    text +=
        `\n> ✦ Exemple : *1*`;

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

    const commandList =
        commands
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
// AFFICHER LE MENU PRINCIPAL
// ==========================================

async function showMainMenu(
    kaya,
    mek,
    from,
    prefix
) {

    cleanExpiredMenus();

    const userId =
        mek.sender;

    const userNumber =
        userId.split("@")[0];

    const userMention =
        `@${userNumber}`;

    const botName =
        getBotName(userId);

    const categories =
        await loadCategories();

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

    // Sauvegarder le menu pour l'utilisateur
    activeMenus.set(
        userId,
        {
            categories,
            sortedCategories,
            prefix,
            createdAt: Date.now()
        }
    );

    const menuText =
        buildMainMenu({
            user: userMention,
            prefix,
            botName,
            categories,
            sortedCategories,
            totalCmds
        });

    await sendMenuImage(
        kaya,
        from,
        userId,
        menuText
    );
}


// ==========================================
// DÉTECTION DES RÉPONSES 1 / 2 / 3...
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

        const userId =
            mek.sender;

        const message =
            String(text).trim();

        const activeMenu =
            activeMenus.get(userId);

        // Pas de menu actif
        if (!activeMenu) {
            return false;
        }


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

        if (
            !/^\d+$/.test(message)
        ) {

            return false;
        }

        const number =
            Number(message);


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
        // CONSTRUIRE LE MENU
        // ======================================

        const categoryText =
            buildCategoryMenu({
                category,
                commands,
                prefix:
                    activeMenu.prefix,
                botName
            });


        // ======================================
        // ENVOYER
        // ======================================

        await sendMenuImage(
            kaya,
            from,
            userId,
            categoryText
        );

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