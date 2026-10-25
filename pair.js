// ==========================================
// PAIRING FILE - pair.js bot web
// ==========================================

import {
    default as makeWASocket,
    jidDecode,
    DisconnectReason,
    useMultiFileAuthState,
    Browsers,
    getContentType
} from "@whiskeysockets/baileys";

import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";
import pino from "pino";
import { fileURLToPath } from "url";

// On importe uniquement le handler principal (caseHandler)
import handler from "./case.js";

import {
    connectionMessage,
    updateMessage,
    getBotName,
    sendWithBotImage
} from "./setting/botAssets.js";

import {
    getContextInfo
} from "./setting/contextInfo.js";

import {
    getSetting,
    setSetting
} from "./setting.js";

// ==========================================
// SEND QUEUE
// ==========================================

import {
    sendLimited,
    destroySendQueue
} from "./utils/kayaUtils.js";

// ==========================================
// MODE ONLINE
// ==========================================

import {
    startAlwaysOnline
} from "./commands/online.js";

// ==========================================
// ANTI DELETE
// ==========================================

import {
    handleAntiDelete
} from "./commands/antidelete.js";

// ==========================================
// PATHS
// ==========================================

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);

// ==========================================
// DOSSIER PAIRING UNIFIÉ (Chemin absolu ou relatif propre)
// ==========================================

const BASE_DIR = fs.existsSync("/home/container/Kaya-MD")
    ? "/home/container/Kaya-MD"
    : process.cwd();

const PAIRING_DIR = path.join(
    BASE_DIR,
    "data",
    "richstore",
    "pairing"
);

if (!fs.existsSync(PAIRING_DIR)) {
    fs.mkdirSync(
        PAIRING_DIR,
        { recursive: true }
    );
}

// ==========================================
// RANDOM BROWSER ROTATION
// ==========================================

function getRandomBrowser() {
    const options = [
        Browsers.macOS("Safari"),
        Browsers.windows("Chrome"),
        Browsers.ubuntu("Firefox")
    ];
    return options[Math.floor(Math.random() * options.length)];
}

// ==========================================
// PAIRING REQUESTS
// ==========================================

const processingRequests =
    new Set();

export function watchPairingRequests() {

    setInterval(() => {

        if (!fs.existsSync(PAIRING_DIR)) {
            return;
        }

        const files =
            fs.readdirSync(
                PAIRING_DIR
            );

        for (const file of files) {

            if (
                !file.startsWith(
                    "request_"
                )
            ) {
                continue;
            }

            try {

                const filePath =
                    path.join(
                        PAIRING_DIR,
                        file
                    );

                const data =
                    JSON.parse(
                        fs.readFileSync(
                            filePath,
                            "utf-8"
                        )
                    );

                const teleId =
                    file
                        .replace(
                            "request_",
                            ""
                        )
                        .replace(
                            ".json",
                            ""
                        );

                const cleanNumber =
                    (
                        data.jid || ""
                    ).replace(
                        /[^0-9]/g,
                        ""
                    );

                const requestKey =
                    `${teleId}_${cleanNumber}`;

                if (
                    processingRequests.has(
                        requestKey
                    )
                ) {

                    fs.unlinkSync(
                        filePath
                    );

                    continue;
                }

                console.log(
                    `[WATCHER] 📥 Demande de pairing détectée pour : ${data.jid}`
                );

                fs.unlinkSync(
                    filePath
                );

                processingRequests.add(
                    requestKey
                );

                startpairing(
                    data.jid,
                    teleId,
                    data.name ||
                        "Client WhatsApp"
                )
                    .then(() => {
                        processingRequests.delete(
                            requestKey
                        );
                    })
                    .catch(error => {

                        processingRequests.delete(
                            requestKey
                        );

                        console.error(
                            `[WATCHER] ❌ Erreur startpairing pour ${data.jid}:`,
                            error
                        );
                    });

            } catch (error) {

                console.error(
                    "[WATCHER] ❌ Erreur traitement demande:",
                    error
                );
            }
        }

    }, 5000);
}

// ==========================================
// RESTAURATION DES SESSIONS (Optimisé en parallèle par lots)
// ==========================================

export async function restoreSessions() {

    if (!fs.existsSync(PAIRING_DIR)) {
        return;
    }

    const folders =
        fs.readdirSync(
            PAIRING_DIR
        );

    const validFolders = [];

    for (const folder of folders) {

        if (
            folder.startsWith(
                "request_"
            ) ||
            folder.startsWith(
                "pairing_"
            ) ||
            folder.endsWith(
                ".json"
            )
        ) {
            continue;
        }

        const sessionPath =
            path.join(
                PAIRING_DIR,
                folder
            );

        if (
            !fs.lstatSync(
                sessionPath
            ).isDirectory()
        ) {
            continue;
        }

        const credsPath =
            path.join(
                sessionPath,
                "creds.json"
            );

        if (
            !fs.existsSync(
                credsPath
            )
        ) {
            continue;
        }

        let teleId =
            "default";

        let userName =
            "Client WhatsApp";

        const metaPath =
            path.join(
                sessionPath,
                "metadata.json"
            );

        if (
            fs.existsSync(
                metaPath
            )
        ) {

            try {

                const meta =
                    JSON.parse(
                        fs.readFileSync(
                            metaPath,
                            "utf-8"
                        )
                    );

                teleId =
                    meta.teleId ||
                    "default";

                userName =
                    meta.userName ||
                    "Client WhatsApp";

            } catch {}
        }

        validFolders.push({ folder, teleId, userName });
    }

    // Lancement par vagues de 5 sessions pour ne pas saturer la mémoire et le CPU
    const batchSize = 5;
    for (let i = 0; i < validFolders.length; i += batchSize) {
        const batch = validFolders.slice(i, i + batchSize);
        
        await Promise.all(
            batch.map(async ({ folder, teleId, userName }) => {
                console.log(
                    `[RESTORE] 🔄 Restauration de la session : ${folder} (ID: ${teleId})`
                );
                try {
                    await startpairing(folder, teleId, userName);
                } catch (error) {
                    console.error(
                        `[RESTORE] ❌ Erreur restauration ${folder}:`,
                        error.message
                    );
                }
            })
        );

        // Petit répit entre chaque batch
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// ==========================================
// TRACKER
// ==========================================

const rentbotTracker =
    new Map();

const sleep = ms =>
    new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

// ==========================================
// SUPPRESSION DOSSIER
// ==========================================

function deleteFolderRecursive(
    folderPath
) {

    if (
        !fs.existsSync(
            folderPath
        )
    ) {
        return;
    }

    fs.readdirSync(
        folderPath
    ).forEach(file => {

        const curPath =
            path.join(
                folderPath,
                file
            );

        if (
            fs.lstatSync(
                curPath
            ).isDirectory()
        ) {

            deleteFolderRecursive(
                curPath
            );

        } else {

            fs.unlinkSync(
                curPath
            );
        }
    });

    fs.rmdirSync(
        folderPath
    );
}

// ==========================================
// CLEANUP SESSION
// ==========================================

export function forceCleanupSession(
    number,
    teleId = "default"
) {

    console.log(
        `[CLEANUP] 🧹 Nettoyage de la session pour : ${number}`
    );

    const cleanNumber =
        number.replace(
            /[^0-9]/g,
            ""
        );

    const sessionPath =
        path.join(
            PAIRING_DIR,
            cleanNumber
        );

    if (
        rentbotTracker.has(
            cleanNumber
        )
    ) {

        const tracker =
            rentbotTracker.get(
                cleanNumber
            );

        if (
            tracker.connection
        ) {

            try {

                destroySendQueue(
                    tracker.connection
                );

            } catch {}

            try {

                tracker.connection.ev
                    .removeAllListeners(
                        "connection.update"
                    );

                tracker.connection.ev
                    .removeAllListeners(
                        "creds.update"
                    );

                tracker.connection.ev
                    .removeAllListeners(
                        "messages.upsert"
                    );

                tracker.connection.ev
                    .removeAllListeners(
                        "messages.update"
                    );

                tracker.connection.ev
                    .removeAllListeners(
                        "group-participants.update"
                    );

            } catch {}

            try {

                tracker.connection.ws?.close();

            } catch {}

            try {

                tracker.connection.end();

            } catch {}
        }

        rentbotTracker.delete(
            cleanNumber
        );
    }

    if (
        fs.existsSync(
            sessionPath
        )
    ) {

        deleteFolderRecursive(
            sessionPath
        );
    }

    const pairingFile =
        path.join(
            PAIRING_DIR,
            `pairing_${cleanNumber}.json`
        );

    if (
        fs.existsSync(
            pairingFile
        )
    ) {
        fs.unlinkSync(pairingFile);
    }

    if (
        teleId &&
        teleId !== "default"
    ) {

        const altPairingFile =
            path.join(
                PAIRING_DIR,
                `pairing_${teleId}.json`
            );

        if (
            fs.existsSync(
                altPairingFile
            )
        ) {

            fs.unlinkSync(
                altPairingFile
            );
        }
    }

    const configDir =
        path.join(
            BASE_DIR,
            "userall",
            cleanNumber
        );

    if (
        fs.existsSync(
            configDir
        )
    ) {

        deleteFolderRecursive(
            configDir
        );
    }
}

// ==========================================
// MESSAGE CONNEXION / UPDATE
// ==========================================

async function sendConnectionOrUpdateMessage(
    kaya,
    ownerCleanId,
    statusFile
) {

    const botName =
        getBotName(
            ownerCleanId
        );

    let messageText =
        "";

    if (
        fs.existsSync(
            statusFile
        )
    ) {

        try {

            const updateData =
                JSON.parse(
                    fs.readFileSync(
                        statusFile,
                        "utf-8"
                    )
                );

            fs.unlinkSync(
                statusFile
            );

            messageText =
                updateMessage(
                    updateData,
                    botName
                );

        } catch (err) {

            console.error(
                "❌ Erreur lecture update_status.json:",
                err.message
            );

            if (
                fs.existsSync(
                    statusFile
                )
            ) {

                fs.unlinkSync(
                    statusFile
                );
            }
        }
    }

    if (!messageText) {

        messageText =
            connectionMessage(
                botName
            );
    }

    await sendWithBotImage(
        kaya,
        ownerCleanId +
            "@s.whatsapp.net",
        ownerCleanId,
        {
            caption:
                messageText,

            contextInfo:
                getContextInfo(
                    ownerCleanId
                )
        }
    );
}

// ==========================================
// START PAIRING
// ==========================================

export default async function startpairing(
    nexusDevNumber,
    teleId = "default",
    userName = "Client WhatsApp",
    attempt = 0
) {

    const number =
        nexusDevNumber.replace(
            /[^0-9]/g,
            ""
        );

    if (
        !number ||
        number.length < 9
    ) {

        console.error(
            `[PAIRING] ❌ Numéro invalide : ${nexusDevNumber}`
        );

        throw new Error(
            "Numéro invalide (minimum 9 chiffres requis)"
        );
    }

    const instanceId =
        Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase();

    const logPrefix =
        `[${number} | ID:${instanceId}]`;

    if (
        rentbotTracker.has(
            number
        )
    ) {

        const oldTracker =
            rentbotTracker.get(
                number
            );

        if (
            oldTracker.connection
        ) {

            try {

                destroySendQueue(
                    oldTracker.connection
                );

            } catch {}

            try {

                oldTracker.connection.ev
                    .removeAllListeners(
                        "connection.update"
                    );

                oldTracker.connection.ev
                    .removeAllListeners(
                        "creds.update"
                    );

                oldTracker.connection.ev
                    .removeAllListeners(
                        "messages.upsert"
                    );

                oldTracker.connection.ev
                    .removeAllListeners(
                        "messages.update"
                    );

                oldTracker.connection.ev
                    .removeAllListeners(
                        "group-participants.update"
                    );

            } catch {}

            try {

                oldTracker.connection.ws?.close();

            } catch {}

            try {

                oldTracker.connection.end();

            } catch {}
        }

        rentbotTracker.delete(
            number
        );
    }

    let isReady =
        false;

    const tracker = {
        connection: null,
        isConnected: false,
        status: "starting"
    };

    rentbotTracker.set(
        number,
        tracker
    );

    const sessionPath =
        path.join(
            PAIRING_DIR,
            number
        );

    if (
        !fs.existsSync(
            sessionPath
        )
    ) {

        fs.mkdirSync(
            sessionPath,
            {
                recursive: true
            }
        );
    }

    const metadataPath =
        path.join(
            sessionPath,
            "metadata.json"
        );

    if (
        fs.existsSync(
            metadataPath
        )
    ) {

        try {

            const existingMeta =
                JSON.parse(
                    fs.readFileSync(
                        metadataPath,
                        "utf-8"
                    )
                );

            if (
                teleId === "default" &&
                existingMeta.teleId &&
                existingMeta.teleId !==
                    "default"
            ) {

                teleId =
                    existingMeta.teleId;
            }

            if (
                userName ===
                    "Client WhatsApp" &&
                existingMeta.userName &&
                existingMeta.userName !==
                    "Client WhatsApp"
            ) {

                userName =
                    existingMeta.userName;
            }

        } catch {}
    }

    fs.writeFileSync(
        metadataPath,
        JSON.stringify(
            {
                number:
                    nexusDevNumber,

                teleId,

                userName,

                timestamp:
                    new Date().toISOString()
            },
            null,
            2
        )
    );

    const {
        state,
        saveCreds
    } =
        await useMultiFileAuthState(
            sessionPath
        );

    const kaya =
        makeWASocket({

            logger:
                pino({
                    level: "silent"
                }).child({ level: "silent" }),

            printQRInTerminal:
                false,

            auth:
                state,

            browser:
                getRandomBrowser(),

            connectTimeoutMs:
                60000,

            defaultQueryTimeoutMs:
                60000,

            keepAliveIntervalMs:
                30000,

            markOnlineOnConnect:
                false,

            emitOwnEvents:
                false
        });

    if (!kaya._patched) {

        const originalSend =
            kaya.sendMessage.bind(
                kaya
            );

        kaya.sendMessage =
            async (
                jid,
                content,
                options = {}
            ) => {

                return await sendLimited(
                    kaya,
                    originalSend,
                    jid,
                    content,
                    options
                );
            };

        kaya._patched =
            true;
    }

    tracker.connection =
        kaya;

    if (
        !state.creds.registered
    ) {

        setTimeout(
            async () => {

                try {

                    if (
                        rentbotTracker
                            .get(number)
                            ?.connection !== kaya
                    ) {
                        return;
                    }

                    const pairingFile =
                        path.join(
                            PAIRING_DIR,
                            `pairing_${number}.json`
                        );

                    const altPairingFile =
                        teleId && teleId !== "default"
                            ? path.join(PAIRING_DIR, `pairing_${teleId}.json`)
                            : null;

                    if (
                        fs.existsSync(
                            pairingFile
                        )
                    ) {

                        fs.unlinkSync(
                            pairingFile
                        );
                    }

                    if (
                        altPairingFile &&
                        fs.existsSync(
                            altPairingFile
                        )
                    ) {

                        fs.unlinkSync(
                            altPairingFile
                        );
                    }

                    let code =
                        await kaya.requestPairingCode(
                            number
                        );

                    code =
                        code
                            ?.match(
                                /.{1,4}/g
                            )
                            ?.join("-") ||
                        code;

                    console.log(
                        `${logPrefix} 📟 Code de pairage généré : ${code}`
                    );

                    const payload = JSON.stringify(
                        {
                            number:
                                nexusDevNumber,

                            code,

                            userName,

                            timestamp:
                                new Date().toISOString()
                        },
                        null,
                        2
                    );

                    fs.writeFileSync(
                        pairingFile,
                        payload
                    );

                    if (altPairingFile) {
                        fs.writeFileSync(
                            altPairingFile,
                            payload
                        );
                    }

                } catch (err) {

                    console.error(
                        `${logPrefix} ❌ Erreur génération code:`,
                        err.message
                    );
                }

            },
            3000
        );
    }

    kaya.decodeJid =
        jid => {

            if (!jid) {
                return jid;
            }

            if (
                /:/g.test(jid)
            ) {

                const decode =
                    jidDecode(jid) ||
                    {};

                return (
                    decode.user &&
                    decode.server
                )
                    ? `${decode.user}@${decode.server}`
                    : jid;
            }

            return jid;
        };

    kaya.ev.on(
        "messages.upsert",
        async chatUpdate => {

            if (!isReady) {
                return;
            }

            try {

                const rawMsg =
                    chatUpdate.messages[0];

                if (
                    !rawMsg?.message ||
                    rawMsg.key?.id?.startsWith(
                        "BAE5"
                    )
                ) {
                    return;
                }

                const mek =
                    smsg(
                        kaya,
                        rawMsg
                    );

                await handler(
                    kaya,
                    mek,
                    chatUpdate
                );

            } catch (err) {

                console.error(
                    `${logPrefix} [MESSAGES ERROR]:`,
                    err?.message ||
                        err
                );
            }
        }
    );

    kaya.ev.on(
        "messages.update",
        async updates => {

            if (!isReady) {
                return;
            }

            try {

                await handleAntiDelete(
                    kaya,
                    updates
                );

            } catch (err) {

                console.error(
                    "[ANTI-DELETE EVENT ERROR]:",
                    err
                );
            }
        }
    );

    // ==========================================
    // GROUP PARTICIPANTS
    // ==========================================

    kaya.ev.on(
        "group-participants.update",
        async update => {

            if (!isReady) {
                return;
            }

            try {

                const caseModule =
                    await import(
                        "./case.js"
                    );

                const commandMap =
                    caseModule.commands;

                const uniqueCommands =
                    new Set(
                        commandMap.values()
                    );

                for (
                    const cmd
                    of uniqueCommands
                ) {

                    if (
                        typeof cmd.participantUpdate ===
                        "function"
                    ) {

                        try {

                            await cmd.participantUpdate(
                                kaya,
                                update
                            );

                        } catch (error) {

                            console.error(
                                "[PARTICIPANT COMMAND ERROR]:",
                                error
                            );
                        }
                    }
                }

            } catch (err) {

                console.error(
                    "[GROUP PARTICIPANTS ERROR]:",
                    err
                );
            }
        }
    );

    kaya.ev.on(
        "connection.update",
        async update => {

            const {
                connection,
                lastDisconnect
            } = update;

            if (
                connection === "open"
            ) {

                if (
                    rentbotTracker
                        .get(number)
                        ?.connection !== kaya
                ) {
                    return;
                }

                console.log(
                    `${logPrefix} 🟢 Connexion réussie`
                );

                isReady =
                    true;

                tracker.status =
                    "connected";

                try {
                    const initialized = getSetting(number, 'welcomeInitialized', false);
                    if (!initialized) {
                        await setSetting(number, 'welcomeInitialized', true);
                        await setSetting(number, 'welcomeAll', 'on');
                        console.log(`${logPrefix} [WELCOME INIT] Première initialisation automatique : welcomeAll = ON`);
                    }
                } catch (e) {
                    console.error(`${logPrefix} [WELCOME INIT ERROR]:`, e.message);
                }

                try {
                    const onlineEnabled = false;

                    if (onlineEnabled) {
                        startAlwaysOnline(kaya);
                    }
                } catch (err) {
                    console.error(
                        `${logPrefix} [ONLINE ERROR]:`,
                        err.message
                    );
                }

                const pairingFile =
                    path.join(
                        PAIRING_DIR,
                        `pairing_${number}.json`
                    );

                if (
                    fs.existsSync(
                        pairingFile
                    )
                ) {

                    fs.unlinkSync(
                        pairingFile
                    );
                }

                if (
                    teleId &&
                    teleId !== "default"
                ) {

                    const altPairingFile =
                        path.join(
                            PAIRING_DIR,
                            `pairing_${teleId}.json`
                        );

                    if (
                        fs.existsSync(
                            altPairingFile
                        )
                    ) {

                        fs.unlinkSync(
                            altPairingFile
                        );
                    }
                }

                if (
                    !tracker.isConnected
                ) {

                    tracker.isConnected =
                        true;

                    await sleep(
                        4000
                    );

                    const statusFile =
                        path.join(
                            BASE_DIR,
                            "utils",
                            "update_status.json"
                        );

                    if (
                        fs.existsSync(
                            statusFile
                        )
                    ) {

                        try {

                            await sendConnectionOrUpdateMessage(
                                kaya,
                                number,
                                statusFile
                            );

                        } catch (e) {

                            console.error(
                                `${logPrefix} ❌ Échec envoi message MAJ:`,
                                e.message
                            );
                        }

                    } else {

                        const isWelcomed =
                            getSetting(
                                number,
                                "botWelcomedOnce",
                                false
                            );

                        if (
                            !isWelcomed
                        ) {

                            try {

                                await sendConnectionOrUpdateMessage(
                                    kaya,
                                    number,
                                    statusFile
                                );

                                await setSetting(
                                    number,
                                    "botWelcomedOnce",
                                    true
                                );

                            } catch (e) {

                                console.error(
                                    `${logPrefix} ❌ Échec envoi message initial:`,
                                    e.message
                                );
                            }
                        }
                    }
                }
            }

            if (
                connection === "close"
            ) {

                isReady =
                    false;

                tracker.isConnected =
                    false;

                if (
                    rentbotTracker
                        .get(number)
                        ?.connection !== kaya
                ) {
                    return;
                }

                const statusCode =
                    new Boom(
                        lastDisconnect?.error
                    )
                        ?.output
                        ?.statusCode;

                console.log(
                    `${logPrefix} 🔴 Connexion fermée. Code: ${statusCode}`
                );

                if (
                    statusCode ===
                        DisconnectReason.loggedOut ||
                    statusCode === 403
                ) {

                    console.log(
                        `${logPrefix} ❌ Session fermée définitivement.`
                    );

                    try {

                        destroySendQueue(
                            kaya
                        );

                    } catch {}

                    forceCleanupSession(
                        number,
                        teleId
                    );

                    return;
                }

                try {

                    destroySendQueue(
                        kaya
                    );

                } catch {}

                if (
                    attempt < 10
                ) {

                    const backoffDelay =
                        Math.min(
                            15000 *
                                Math.pow(
                                    2,
                                    attempt
                                ),
                            5 * 60 * 1000
                        );

                    console.log(
                        `${logPrefix} ⚠️ Nouvelle tentative ${attempt + 1}/10 dans ${Math.ceil(backoffDelay / 1000)}s...`
                    );

                    await sleep(
                        backoffDelay
                    );

                    if (
                        rentbotTracker
                            .get(number)
                            ?.connection !== kaya
                    ) {
                        return;
                    }

                    startpairing(
                        nexusDevNumber,
                        teleId,
                        userName,
                        attempt + 1
                    ).catch(error => {

                        console.error(
                            `${logPrefix} ❌ Erreur reconnexion:`,
                            error.message
                        );
                    });

                } else {

                    console.log(
                        `${logPrefix} 🛑 Trop de tentatives. Pause de 5 minutes avant nouvelle tentative.`
                    );

                    await sleep(
                        5 * 60 * 1000
                    );

                    if (
                        rentbotTracker
                            .get(number)
                            ?.connection !== kaya
                    ) {
                        return;
                    }

                    startpairing(
                        nexusDevNumber,
                        teleId,
                        userName,
                        0
                    ).catch(error => {

                        console.error(
                            `${logPrefix} ❌ Erreur reconnexion finale:`,
                            error.message
                        );
                    });
                }
            }
        }
    );

    kaya.ev.on(
        "creds.update",
        () => {

            if (
                rentbotTracker
                    .get(number)
                    ?.connection === kaya
            ) {

                saveCreds().catch(
                    () => {}
                );
            }
        }
    );

    return kaya;
}

// ==========================================
// NORMALISATION MESSAGE
// ==========================================

function smsg(
    kaya,
    m
) {

    if (!m) {
        return m;
    }

    if (m.key) {

        m.id =
            m.key.id;

        m.chat =
            m.key.remoteJid;

        m.fromMe =
            m.key.fromMe;

        m.isGroup =
            m.chat?.endsWith(
                "@g.us"
            );

        m.sender =
            kaya.decodeJid(
                m.fromMe
                    ? kaya.user.id
                    : m.key.participant ||
                      m.participant ||
                      m.chat ||
                      ""
            );
    }

    if (m.message) {

        m.mtype =
            getContentType(
                m.message
            );

        m.msg =
            m.message[
                m.mtype
            ] || {};

        m.body =
            m.message.conversation ||
            m.msg?.caption ||
            m.msg?.text ||
            "";

        const quoted =
            m.msg
                ?.contextInfo
                ?.quotedMessage ||
            null;

        if (quoted) {

            const type =
                getContentType(
                    quoted
                );

            m.quoted =
                quoted[type];

            if (
                typeof m.quoted ===
                "string"
            ) {

                m.quoted = {
                    text:
                        m.quoted
                };
            }

            m.quoted.mtype =
                type;

            m.quoted.sender =
                kaya.decodeJid(
                    m.msg
                        .contextInfo
                        .participant
                );

            m.quoted.text =
                m.quoted.text ||
                m.quoted.caption ||
                "";
        }
    }

    return m;
}
