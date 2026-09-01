// ==================== case.js ====================
import { getContentType } from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import chalk from "chalk";

import decodeJid from "./setting/decodeJid.js";
import checkAdminOrOwner from "./setting/checkAdminOrOwner.js";
import { getSetting } from "./setting.js";

// 🛡️ STOCKAGE ANTI-DELETE
import { storeMessage } from "./commands/antidelete.js";

const __dirname = path.resolve();

export const commands = new Map();
const commandsPath = path.join(__dirname, "commands");

// ==================== TRACKERS ====================

const presenceTracker = new Map();
const cooldownTracker = new Map();

// ==================== CHARGEMENT DES COMMANDES ====================

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
        try {
            const fileUrl = pathToFileURL(
                path.join(commandsPath, file)
            ).href;

            const cmdModule = await import(fileUrl);
            const cmd = cmdModule.default || cmdModule;

            if (cmd?.name) {
                commands.set(
                    cmd.name.toLowerCase(),
                    cmd
                );
            }

            const cmdAliases = cmd?.aliases || cmd?.alias;

            if (Array.isArray(cmdAliases)) {
                cmdAliases.forEach(alias => {
                    if (alias) {
                        commands.set(
                            alias.toLowerCase(),
                            cmd
                        );
                    }
                });
            }

        } catch (error) {
            console.error(
                chalk.red(
                    `[ERREUR] Impossible de charger ${file}:`
                ),
                error
            );
        }
    }
}

// ==================== HANDLER PRINCIPAL ====================

export default async function caseHandler(
    kaya,
    mek,
    chatUpdate,
    store = null
) {
    try {

        // ==================================================
        // VALIDATION DU MESSAGE
        // ==================================================

        if (
            !mek ||
            !mek.message ||
            !mek.key ||
            !mek.key.id ||
            mek.key.id.startsWith("BAE5")
        ) {
            return;
        }

        const sender = mek.sender;
        const from = mek.key.remoteJid;

        if (!from) return;

        const isGroup =
            from.endsWith("@g.us");

        const ownerId =
            kaya.user?.id
                ? kaya.user.id.split(":")[0]
                : "";

        const groupId =
            from.split("@")[0];

        // ==================================================
        // ANTI-DELETE
        // ==================================================

        if (
            getSetting(
                ownerId,
                "antidelete",
                false,
                isGroup ? groupId : null
            )
        ) {
            try {
                storeMessage(kaya, mek);
            } catch (error) {
                console.error(
                    "[ANTIDELETE STORE ERROR]:",
                    error
                );
            }
        }

        // ==================================================
        // STATUS WHATSAPP
        // ==================================================

        if (from === "status@broadcast") {

            const autostatus =
                commands.get("autostatus");

            if (
                autostatus &&
                typeof autostatus.detect ===
                    "function"
            ) {
                await autostatus
                    .detect(kaya, mek, from)
                    .catch(() => {});
            }

            return;
        }

        // ==================================================
        // EXTRACTION DU TEXTE
        // ==================================================

        const type =
            getContentType(mek.message);

        let body = "";

        switch (type) {

            case "interactiveResponseMessage": {

                const paramsJson =
                    mek.message
                        ?.interactiveResponseMessage
                        ?.nativeFlowResponseMessage
                        ?.paramsJson;

                if (paramsJson) {
                    try {
                        const parsed =
                            JSON.parse(paramsJson);

                        body =
                            parsed.id ||
                            parsed.selectedId ||
                            parsed.command ||
                            "";

                    } catch (error) {}
                }

                break;
            }

            case "templateButtonReplyMessage":

                body =
                    mek.message
                        ?.templateButtonReplyMessage
                        ?.selectedId ||
                    "";

                break;

            case "buttonsResponseMessage":

                body =
                    mek.message
                        ?.buttonsResponseMessage
                        ?.selectedButtonId ||
                    "";

                break;

            case "conversation":

                body =
                    mek.message?.conversation ||
                    "";

                break;

            case "extendedTextMessage":

                body =
                    mek.message
                        ?.extendedTextMessage
                        ?.text ||
                    mek.message
                        ?.extendedTextMessage
                        ?.contextInfo
                        ?.externalAdReply
                        ?.body ||
                    "";

                break;

            case "imageMessage":

                body =
                    mek.message
                        ?.imageMessage
                        ?.caption ||
                    "";

                break;

            case "videoMessage":

                body =
                    mek.message
                        ?.videoMessage
                        ?.caption ||
                    "";

                break;

            default:
                body = "";
        }

        // ==================================================
        // DÉTECTION DE COMMANDE
        // ==================================================

        let isCommand = false;
        let commandName = "";
        let prefix = "";
        let args = [];

        if (body) {

            const trimmedBody =
                body.trim();

            if (trimmedBody) {

                const splitArgs =
                    trimmedBody.split(/\s+/);

                const firstWord =
                    splitArgs[0]?.toLowerCase() ||
                    "";

                const userPrefix =
                    getSetting(
                        ownerId,
                        "prefix",
                        "."
                    );

                const isAllPrefixEnabled =
                    Boolean(
                        getSetting(
                            ownerId,
                            "allPrefix",
                            true
                        )
                    );

                const noPrefixEnabled =
                    Boolean(
                        getSetting(
                            ownerId,
                            "noPrefix",
                            false
                        )
                    );

                // ==================================================
                // NO PREFIX
                // ==================================================

                if (noPrefixEnabled) {

                    if (
                        commands.has(firstWord)
                    ) {
                        prefix = "";
                        args = splitArgs;
                        commandName = firstWord;
                        isCommand = true;
                    }

                }

                // ==================================================
                // PREFIX PERSONNALISÉ
                // ==================================================

                else if (
                    userPrefix &&
                    trimmedBody.startsWith(
                        userPrefix
                    )
                ) {

                    prefix = userPrefix;

                    const commandText =
                        trimmedBody
                            .slice(userPrefix.length)
                            .trim();

                    args = commandText
                        ? commandText.split(/\s+/)
                        : [];

                    const rawCmd =
                        args[0]?.toLowerCase();

                    if (
                        rawCmd &&
                        commands.has(rawCmd)
                    ) {
                        commandName = rawCmd;
                        isCommand = true;
                    }

                }

                // ==================================================
                // TOUS LES PREFIX
                // ==================================================

                else if (
                    isAllPrefixEnabled &&
                    /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#%^&.©^]/
                        .test(trimmedBody)
                ) {

                    const match =
                        trimmedBody.match(
                            /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#%^&.©^]/
                        );

                    if (match) {

                        prefix = match[0];

                        const commandText =
                            trimmedBody
                                .slice(prefix.length)
                                .trim();

                        args = commandText
                            ? commandText.split(/\s+/)
                            : [];

                        const rawCmd =
                            args[0]?.toLowerCase();

                        if (
                            rawCmd &&
                            commands.has(rawCmd)
                        ) {
                            commandName = rawCmd;
                            isCommand = true;
                        }
                    }
                }
            }
        }

        // ==================================================
        // VÉRIFICATION DES UTILITAIRES
        // ==================================================

        const utilsList = [
            "antibot",
            "antilink",
            "antitag",
            "antispam",
            "antistatus",
            "antimention"
        ];

        let hasActiveUtility = false;

        for (const utilName of utilsList) {

            if (
                getSetting(
                    ownerId,
                    utilName,
                    false,
                    groupId
                )
            ) {
                hasActiveUtility = true;
                break;
            }
        }

        // ==================================================
        // CHATBOT
        // ==================================================

        const chatbotMode =
            getSetting(
                ownerId,
                "chatbot_mode",
                "off"
            );

        const isChatbotActive =
            chatbotMode !== "off";

        if (
            !isCommand &&
            isChatbotActive
        ) {

            const isMedia = [
                "imageMessage",
                "videoMessage",
                "stickerMessage",
                "documentMessage",
                "audioMessage"
            ].includes(type);

            if (!isMedia && body) {

                const chatbotModule =
                    commands.get("chatbot");

                if (
                    chatbotModule &&
                    typeof chatbotModule.listen ===
                        "function"
                ) {
                    await chatbotModule.listen(
                        kaya,
                        mek,
                        from,
                        body,
                        ownerId
                    );
                }
            }
        }

        // ==================================================
        // OPTIMISATION
        // ==================================================

        if (
            !isCommand &&
            !hasActiveUtility &&
            !isChatbotActive
        ) {
            return;
        }

        // ==================================================
        // SIMULATION DE PRÉSENCE
        // ==================================================

        const lastPresence =
            presenceTracker.get(from) || 0;

        if (
            Math.random() > 0.4 &&
            Date.now() - lastPresence > 30000
        ) {

            let presenceSent = false;

            if (
                getSetting(
                    ownerId,
                    "typing",
                    false
                )
            ) {

                await kaya
                    .sendPresenceUpdate(
                        "composing",
                        from
                    )
                    .catch(() => {});

                presenceSent = true;
            }

            if (
                getSetting(
                    ownerId,
                    "recording",
                    false
                )
            ) {

                await kaya
                    .sendPresenceUpdate(
                        "recording",
                        from
                    )
                    .catch(() => {});

                presenceSent = true;
            }

            if (presenceSent) {
                presenceTracker.set(
                    from,
                    Date.now()
                );
            }
        }

        // ==================================================
        // AUTO-REACTION
        // ==================================================

        const autoReact =
            commands.get("autoreact");

        if (
            autoReact &&
            getSetting(
                ownerId,
                "autoreact",
                false
            ) &&
            typeof autoReact.listen ===
                "function"
        ) {

            await autoReact
                .listen(
                    kaya,
                    mek,
                    from
                )
                .catch(() => {});
        }

        // ==================================================
        // EXÉCUTION DES UTILITAIRES
        // ==================================================

        await executeUtilities(
            kaya,
            mek,
            from,
            body,
            ownerId,
            groupId
        );

        if (!isCommand) return;

        // ==================================================
        // VÉRIFICATION OWNER / SUDO
        // ==================================================

        const status =
            await checkAdminOrOwner(
                kaya,
                from,
                sender
            );

        const sudoList =
            getSetting(
                ownerId,
                "sudo_list",
                []
            );

        const isSudo =
            Array.isArray(sudoList) &&
            sudoList.includes(sender);

        // ==================================================
        // MODE PRIVÉ
        // ==================================================

        if (!mek.key.fromMe) {

            const privateMode =
                getSetting(
                    ownerId,
                    "privateMode",
                    false
                );

            const blockInbox =
                getSetting(
                    ownerId,
                    "blockInbox",
                    false
                );

            const userPrefix =
                getSetting(
                    ownerId,
                    "prefix",
                    "."
                );

            const lowerBody =
                body.toLowerCase();

            const isPairCommand =
                lowerBody.startsWith(
                    `${userPrefix}pair`
                ) ||
                lowerBody.startsWith("pair");

            if (!isPairCommand) {

                if (
                    privateMode ||
                    (blockInbox && !isGroup)
                ) {

                    if (
                        !status.isBotOwner &&
                        !isSudo
                    ) {
                        return;
                    }
                }
            }
        }

        // ==================================================
        // UTILISATEUR BANNI
        // ==================================================

        if (
            getSetting(
                ownerId,
                `banned_${sender}`,
                false
            )
        ) {
            return;
        }

        // ==================================================
        // RÉCUPÉRATION DE LA COMMANDE
        // ==================================================

        const rawCommand =
            args.shift();

        if (!rawCommand) return;

        const command =
            rawCommand.toLowerCase();

        const cmd =
            commands.get(command);

        if (!cmd) return;

        // ==================================================
        // OWNER ONLY
        // ==================================================

        if (
            cmd.ownerOnly &&
            !status.isBotOwner &&
            !isSudo
        ) {

            return await kaya.sendMessage(
                from,
                {
                    text: "Owner or Sudo only."
                },
                {
                    quoted: mek
                }
            );
        }

        // ==================================================
        // GROUP ONLY
        // ==================================================

        if (
            cmd.group &&
            !isGroup
        ) {

            return await kaya.sendMessage(
                from,
                {
                    text: "Group only."
                },
                {
                    quoted: mek
                }
            );
        }

        // ==================================================
        // ADMIN ONLY
        // ==================================================

        if (
            cmd.admin &&
            !status.isAdmin
        ) {

            return await kaya.sendMessage(
                from,
                {
                    text: "Admin only."
                },
                {
                    quoted: mek
                }
            );
        }

        // ==================================================
        // ANTI-FLOOD
        // ==================================================

        const lastCommandTime =
            cooldownTracker.get(sender) || 0;

        if (
            Date.now() - lastCommandTime < 5000
        ) {

            console.log(
                chalk.yellow(
                    `[ANTI-FLOOD] Commande ${command} ignorée pour ${sender}`
                )
            );

            return;
        }

        cooldownTracker.set(
            sender,
            Date.now()
        );

        // ==================================================
        // BOT ADMIN
        // ==================================================

        if (cmd.botAdmin) {

            const metadata =
                await kaya
                    .groupMetadata(from)
                    .catch(() => null);

            if (!metadata) {

                return await kaya.sendMessage(
                    from,
                    {
                        text:
                            "Error reading group metadata."
                    },
                    {
                        quoted: mek
                    }
                );
            }

            const botNumber =
                decodeJid(
                    kaya.user.id
                ).split("@")[0];

            const botData =
                metadata.participants.find(
                    participant => {

                        const participantNumber =
                            (
                                participant.phoneNumber ||
                                decodeJid(
                                    participant.id
                                )
                            ).split("@")[0];

                        return (
                            participantNumber ===
                            botNumber
                        );
                    }
                );

            if (
                !botData ||
                botData.admin === null
            ) {

                return await kaya.sendMessage(
                    from,
                    {
                        text:
                            "Bot must be admin."
                    },
                    {
                        quoted: mek
                    }
                );
            }
        }

        // ==================================================
        // LOG
        // ==================================================

        console.log(
            chalk.black(
                chalk.bgWhite("[ CMD ]")
            ),
            chalk.green(command),
            "from",
            chalk.blue(
                mek.pushName || from
            )
        );

        // ==================================================
        // EXÉCUTION DE LA COMMANDE
        // ==================================================

        try {

            if (
                typeof cmd.execute ===
                "function"
            ) {

                await cmd.execute(
                    kaya,
                    mek,
                    from,
                    args,
                    prefix
                );

            } else if (
                typeof cmd.run ===
                "function"
            ) {

                await cmd.run(
                    kaya,
                    mek,
                    args,
                    prefix
                );
            }

        } catch (cmdErr) {

            console.error(
                chalk.red(
                    `[ERREUR COMMANDE] (${command}):`
                ),
                cmdErr.stack || cmdErr
            );

            await kaya
                .sendMessage(
                    from,
                    {
                        text:
                            `❌ Une erreur critique est survenue lors de l'exécution de la commande *${command}*.`
                    },
                    {
                        quoted: mek
                    }
                )
                .catch(() => {});
        }

    } catch (err) {

        console.error(
            chalk.red("[ERROR case.js]:"),
            err.stack || err
        );
    }
}

// ======================================================
// EXÉCUTION DES UTILITAIRES
// ======================================================

async function executeUtilities(
    kaya,
    mek,
    from,
    body,
    ownerId,
    groupId
) {

    const utils = [

        {
            name: "antibot",
            setting: "antibot"
        },

        {
            name: "antilink",
            setting: "antilink"
        },

        {
            name: "antitag",
            setting: "antitag"
        },

        {
            name: "antispam",
            setting: "antispam"
        },

        {
            name: "antistatus",
            setting: "antistatus"
        },

        {
            name: "antimention",
            setting: "antimention"
        }
    ];

    for (const utilConf of utils) {

        const isEnabled =
            getSetting(
                ownerId,
                utilConf.setting,
                false,
                groupId
            );

        if (!isEnabled) continue;

        const util =
            commands.get(
                utilConf.name
            );

        if (
            util &&
            typeof util.detect ===
                "function"
        ) {

            try {

                await util.detect(
                    kaya,
                    mek,
                    from,
                    body
                );

            } catch (error) {

                console.error(
                    `[UTILITY ERROR - ${utilConf.name}]:`,
                    error
                );
            }
        }
    }
}
