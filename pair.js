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
import handler, { commands } from "./case.js"; 
import { connectionMessage } from "./setting/botAssets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAIRING_DIR = path.join(process.cwd(), "richstore", "pairing");

if (!fs.existsSync(PAIRING_DIR)) {
    fs.mkdirSync(PAIRING_DIR, { recursive: true });
}

export function watchPairingRequests() {
    setInterval(async () => {
        if (!fs.existsSync(PAIRING_DIR)) return;
        const files = fs.readdirSync(PAIRING_DIR);
        for (const file of files) {
            if (file.startsWith('request_')) {
                try {
                    const filePath = path.join(PAIRING_DIR, file);
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    const teleId = file.replace('request_', '').replace('.json', '');
                    
                    console.log(`✨ Traitement automatique de la demande pour : ${data.jid}`);
                    await startpairing(data.jid, teleId, data.name);
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error("❌ Erreur de traitement de demande:", e);
                }
            }
        }
    }, 5000);
}

export async function restoreSessions() {
    if (!fs.existsSync(PAIRING_DIR)) return;
    
    const items = fs.readdirSync(PAIRING_DIR);
    const sessionFolders = items.filter(item => {
        return fs.lstatSync(path.join(PAIRING_DIR, item)).isDirectory();
    });

    console.log(`🚀 Démarrage rapide de ${sessionFolders.length} sessions...`);

    for (const folder of sessionFolders) {
        startpairing(folder).catch((err) => {
            console.error(`❌ Erreur session ${folder}:`, err);
        });
        await new Promise(resolve => setTimeout(resolve, 300)); 
    }
    console.log(`✅ Toutes les sessions ont été initialisées.`);
}

const rentbotTracker = new Map();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach(file => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) deleteFolderRecursive(curPath);
            else fs.unlinkSync(curPath);
        });
        fs.rmdirSync(folderPath);
    }
}

export function forceCleanupSession(number, teleId) {
    const sessionPath = path.join(PAIRING_DIR, number);
    const pairingFile = path.join(PAIRING_DIR, `pairing_${teleId}.json`);
    if (fs.existsSync(sessionPath)) deleteFolderRecursive(sessionPath);
    if (fs.existsSync(pairingFile)) fs.unlinkSync(pairingFile);
    if (rentbotTracker.has(number)) {
        const tracker = rentbotTracker.get(number);
        if (tracker.connection) { try { tracker.connection.end(); } catch (e) {} }
        rentbotTracker.delete(number);
    }
}

export default async function startpairing(nexusDevNumber, teleId = "default", userName = "Unknown") {
    const number = nexusDevNumber.replace(/[^0-9]/g, "");
    if (!number) return;

    const pairingFilePath = path.join(PAIRING_DIR, `pairing_${teleId}.json`);

    if (rentbotTracker.has(number)) {
        const tracker = rentbotTracker.get(number);
        if (tracker.connection) {
            try { tracker.connection.end(); } catch (e) {}
        }
    }

    rentbotTracker.set(number, { connection: null, retryCount: 0, disconnected: false });
    const tracker = rentbotTracker.get(number);

    const sessionPath = path.join(PAIRING_DIR, number);
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const kaya = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS("Chrome"),
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        markOnlineOnConnect: true,
    });

    tracker.connection = kaya;

    if (!state.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await kaya.requestPairingCode(number);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                fs.writeFileSync(pairingFilePath, JSON.stringify({ number: nexusDevNumber, code, userName, timestamp: new Date().toISOString() }, null, 2));
            } catch (err) {}
        }, 5000);
    }

    kaya.ev.on("messages.upsert", async chatUpdate => {
        try {
            const rawMsg = chatUpdate.messages[0];
            if (!rawMsg.message || rawMsg.key.id.startsWith("BAE5")) return;
            const mek = smsg(kaya, rawMsg);
            await handler(kaya, mek, chatUpdate); 
        } catch (err) {}
    });

    kaya.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "open") {
            console.log(`✅ Session active pour : ${nexusDevNumber}`);
            if (fs.existsSync(pairingFilePath)) fs.unlinkSync(pairingFilePath);
            await sleep(3000);
            const msg = connectionMessage();
            await kaya.sendMessage(nexusDevNumber + "@s.whatsapp.net", { text: msg });
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            
            // Suppression uniquement en cas de déconnexion volontaire explicite
            if (statusCode === DisconnectReason.loggedOut) {
                console.log("🛑 Déconnexion volontaire, suppression des données.");
                forceCleanupSession(number, teleId);
            } else {
                console.log(`⚠️ Connexion perdue (Code: ${statusCode}). Reconnexion dans 10s...`);
                await sleep(10000);
                startpairing(nexusDevNumber, teleId);
            }
        }
    });

    kaya.ev.on("creds.update", saveCreds);
    return kaya;
}

function smsg(kaya, m) {
    if (!m) return m;
    if (m.key) {
        m.id = m.key.id;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat?.endsWith("@g.us");
        m.sender = kaya.decodeJid(m.fromMe ? kaya.user.id : m.participant || m.key.participant || m.chat || "");
    }
    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = m.message[m.mtype] || {};
        m.body = m.message.conversation || m.msg?.caption || m.msg?.text || "";
        let quoted = m.msg?.contextInfo?.quotedMessage || null;
        if (quoted) {
            const type = getContentType(quoted);
            m.quoted = quoted[type];
            if (typeof m.quoted === "string") m.quoted = { text: m.quoted };
            m.quoted.mtype = type;
            m.quoted.sender = kaya.decodeJid(m.msg.contextInfo.participant);
            m.quoted.text = m.quoted.text || m.quoted.caption || "";
        }
    }
    return m;
}
