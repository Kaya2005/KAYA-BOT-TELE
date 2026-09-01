// ==================== pair.js ====================

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

import handler, {
    commands
} from "./case.js";

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

const PAIRING_DIR =
    path.join(
        process.cwd(),
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
// RESTAURATION DES SESSIONS
// ==========================================

export async function restoreSessions() {

    if (!fs.existsSync(PAIRING_DIR)) {
        return;
    }

    const folders =
        fs.readdirSync(
            PAIRING_DIR
        );

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

        console.log(
            `[RESTORE] 🔄 Restauration de la session : ${folder} (TeleID: ${teleId})`
        );

        startpairing(
            folder,
            teleId,
            userName
        ).catch(error => {

            console.error(
                `[RESTORE] ❌ Erreur restauration ${folder}:`,
                error.message
            );
        });

        // Évite de lancer toutes les sessions
        // exactement au même moment.
        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    5000
                )
        );
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

    // ==========================================
    // ARRÊT SOCKET + QUEUE
    // ==========================================

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

    // ==========================================
    // SESSION
    // ==========================================

    if (
        fs.existsSync(
            sessionPath
        )
    ) {

        deleteFolderRecursive(
            sessionPath
        );
    }

    // ==========================================
    // PAIRING FILE
    // ==========================================

    if (
        teleId &&
        teleId !== "default"
    ) {

        const pairingFile =
            path.join(
                PAIRING_DIR,
                `pairing_${teleId}.json`
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

    } else {

        if (
            fs.existsSync(
                PAIRING_DIR
            )
        ) {

            const files =
                fs.readdirSync(
                    PAIRING_DIR
                );

            for (
                const file of files
            ) {

                if (
                    file.startsWith(
                        "pairing_"
                    ) &&
                    file.endsWith(
                        ".json"
                    )
                ) {

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

                        if (
                            (
                                data.number ||
                                ""
                            ).replace(
                                /[^0-9]/g,
                                ""
                            ) === cleanNumber
                        ) {

                            fs.unlinkSync(
                                filePath
                            );
                        }

                    } catch {}
                }
            }
        }
    }

    // ==========================================
    // CONFIG
    // ==========================================

    const possibleConfigPaths = [

        path.join(
            "/home/container/Kaya-MD",
            "userall",
            cleanNumber
        ),

        path.join(
            process.cwd(),
            "userall",
            cleanNumber
        )
    ];

    for (
        const configDir
        of possibleConfigPaths
    ) {

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

    // ==========================================
    // FERMER ANCIENNE INSTANCE
    // ==========================================

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

    // ==========================================
    // TRACKER
    // ==========================================

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

    // ==========================================
    // SESSION PATH
    // ==========================================

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

    // ==========================================
    // METADATA
    // ==========================================

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

    // ==========================================
    // AUTH STATE
    // ==========================================

    const {
        state,
        saveCreds
    } =
        await useMultiFileAuthState(
            sessionPath
        );

    await sleep(2000);

    // ==========================================
    // SOCKET
    // ==========================================

    const kaya =
        makeWASocket({

            logger:
                pino({
                    level: "silent"
                }),

            printQRInTerminal:
                false,

            auth:
                state,

            browser:
                Browsers.ubuntu(
                    "Chrome"
                ),

            connectTimeoutMs:
                60000,

            defaultQueryTimeoutMs:
                60000,

            keepAliveIntervalMs:
                30000,

            // Réduit l'activité de présence
            markOnlineOnConnect:
                false,

            emitOwnEvents:
                false
        });

    // ==========================================
    // SEND MESSAGE PATCH
    // ==========================================

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

    // ==========================================
    // PAIRING CODE
    // ==========================================

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
                            `pairing_${teleId}.json`
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

                    fs.writeFileSync(
                        pairingFile,
                        JSON.stringify(
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
                        )
                    );

                } catch (err) {

                    console.error(
                        `${logPrefix} ❌ Erreur génération code:`,
                        err.message
                    );
                }

            },
            8000
        );
    }

    // ==========================================
    // DECODE JID
    // ==========================================

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

    // ==========================================
    // MESSAGES UPSERT
    // ==========================================

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

                const uniqueCommands =
                    new Set(
                        commands.values()
                    );

                for (
                    const cmd
                    of uniqueCommands
                ) {

                    if (
                        typeof cmd.detect ===
                        "function"
                    ) {

                        await cmd.detect(
                            kaya,
                            mek,
                            mek.chat
                        );
                    }
                }

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

    // ==========================================
    // ANTI DELETE
    // ==========================================

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

                const uniqueCommands =
                    new Set(
                        commands.values()
                    );

                for (
                    const cmd
                    of uniqueCommands
                ) {

                    if (
                        typeof cmd.participantUpdate ===
                        "function"
                    ) {

                        await cmd.participantUpdate(
                            kaya,
                            update
                        );
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

    // ==========================================
    // CONNECTION UPDATE
    // ==========================================

    kaya.ev.on(
        "connection.update",
        async update => {

            const {
                connection,
                lastDisconnect
            } = update;

            // ==========================================
            // OPEN
            // ==========================================

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

                // ==========================================
                // MODE ONLINE
                // ==========================================

                // Conservé pour compatibilité.
                // Si ton module online.js force une présence
                // permanente, il est recommandé de le désactiver
                // dans ses propres réglages.
                try {

                    const onlineEnabled =
                        getSetting(
                            number,
                            "alwaysOnline",
                            false
                        );

                    if (
                        onlineEnabled
                    ) {

                        startAlwaysOnline(
                            kaya
                        );
                    }

                } catch (err) {

                    console.error(
                        `${logPrefix} [ONLINE ERROR]:`,
                        err.message
                    );
                }

                // ==========================================
                // SUPPRESSION PAIRING FILE
                // ==========================================

                if (
                    teleId &&
                    teleId !== "default"
                ) {

                    const pairingFile =
                        path.join(
                            PAIRING_DIR,
                            `pairing_${teleId}.json`
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
                }

                // ==========================================
                // MESSAGE INITIAL
                // ==========================================

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
                            process.cwd(),
                            "utils",
                            "update_status.json"
                        );

                    // ==========================================
                    // MESSAGE UPDATE
                    // ==========================================

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

                        // ==========================================
                        // PREMIÈRE CONNEXION
                        // ==========================================

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

            // ==========================================
            // CLOSE
            // ==========================================

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

                // ==========================================
                // SESSION DÉCONNECTÉE
                // ==========================================

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

                // ==========================================
                // NETTOYAGE DE LA QUEUE
                // ==========================================

                try {

                    destroySendQueue(
                        kaya
                    );

                } catch {}

                // ==========================================
                // RECONNEXION AVEC BACKOFF
                // ==========================================

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

                    // Vérifie que cette session
                    // est toujours la session active.
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

    // ==========================================
    // SAVE CREDENTIALS
    // ==========================================

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
                    : m.participant ||
                      m.key.participant ||
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