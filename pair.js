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
                    
                    console.log(`✨ Traitement automatique pour : ${data.jid}`);
                    await startpairing(data.jid, teleId, data.name);
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error("❌ Erreur traitement demande:", e);
                }
            }
        }
    }, 5000);
}

export async function restoreSessions() {
    if (!fs.existsSync(PAIRING_DIR)) return;
    const folders = fs.readdirSync(PAIRING_DIR);
    for (const folder of folders) {
        const sessionPath = path.join(PAIRING_DIR, folder);
        if (fs.lstatSync(sessionPath).isDirectory()) {
            startpairing(folder).catch(() => {});
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
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

// Ajout du paramètre 'attempt' pour gérer la reconnexion exponentielle
export default async function startpairing(nexusDevNumber, teleId = "default", userName = "Unknown", attempt = 0) {
    const number = nexusDevNumber.replace(/[^0-9]/g, "");
    if (!number) throw new Error("Invalid phone number");

    if (rentbotTracker.has(number)) {
        const tracker = rentbotTracker.get(number);
        if (tracker.connection) { try { tracker.connection.ws.close(); tracker.connection.end(); } catch (e) {} }
    }

    let isReady = false; 
    rentbotTracker.set(number, { connection: null, isConnected: false });
    const tracker = rentbotTracker.get(number);
    const sessionPath = path.join(PAIRING_DIR, number);
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    await sleep(3000); 

    const kaya = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS("Chrome"),
        connectTimeoutMs: 120000, 
        defaultQueryTimeoutMs: 120000,
        keepAliveIntervalMs: 30000,
        markOnlineOnConnect: true,
        emitOwnEvents: false,
    });

    tracker.connection = kaya;

    kaya.ev.on("group-participants.update", async (update) => {
        try {
            const groupId = update.id;
            if (!groupId) return;
            const cmdName = (update.action === 'add') ? 'welcome' : 'bye';
            const cmd = commands.get(cmdName);
            if (cmd && typeof cmd.detect === 'function') {
                await cmd.detect(kaya, update, groupId).catch(console.error);
            }
        } catch (err) {}
    });

    if (!state.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await kaya.requestPairingCode(number);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                fs.writeFileSync(path.join(PAIRING_DIR, `pairing_${teleId}.json`), JSON.stringify({ number: nexusDevNumber, code, userName, timestamp: new Date().toISOString() }, null, 2));
            } catch (err) {}
        }, 5000);
    }

    kaya.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:/g.test(jid)) {
            const decode = jidDecode(jid) || {};
            return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
        }
        return jid;
    };

    kaya.ev.on("messages.upsert", async chatUpdate => {
        if (!isReady) return; 
        try {
            const rawMsg = chatUpdate.messages[0];
            if (!rawMsg.message || rawMsg.key.id.startsWith("BAE5")) return;
            const mek = smsg(kaya, rawMsg);
            await handler(kaya, mek, chatUpdate); 
        } catch (err) { console.error("Error in handler:", err); }
    });

    kaya.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "open") {
            isReady = true;
            // Réinitialisation des tentatives en cas de succès
            attempt = 0; 
            if (!tracker.isConnected) {
                tracker.isConnected = true;
                const msg = connectionMessage();
                await sleep(2000);
                await kaya.sendMessage(nexusDevNumber + "@s.whatsapp.net", { text: msg }).catch(console.error);
            }
        }
        
        if (connection === "close") {
            isReady = false;
            tracker.isConnected = false;
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            
            if (reason === DisconnectReason.loggedOut) {
                console.log("🛑 Déconnexion volontaire, nettoyage.");
                forceCleanupSession(number, teleId);
            } else {
                // Délai exponentiel : 10s, 20s, 30s... jusqu'à 60s max
                const backoffDelay = Math.min(10000 * (attempt + 1), 60000);
                console.log(`⚠️ Connexion perdue (Code: ${reason}). Reconnexion dans ${backoffDelay/1000}s...`);
                await sleep(backoffDelay);
                startpairing(nexusDevNumber, teleId, userName, attempt + 1);
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
