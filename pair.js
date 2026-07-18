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
    // 🔴 CORRECTION : Retrait du 'async' ici pour ne plus bloquer la boucle
    setInterval(() => {
        if (!fs.existsSync(PAIRING_DIR)) return;
        const files = fs.readdirSync(PAIRING_DIR);
        for (const file of files) {
            if (file.startsWith('request_')) {
                try {
                    const filePath = path.join(PAIRING_DIR, file);
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    const teleId = file.replace('request_', '').replace('.json', '');

                    console.log(`[WATCHER] ✨ Demande détectée pour : ${data.jid}`);  
                    
                    // 🔴 CORRECTION : On supprime le fichier IMMÉDIATEMENT
                    fs.unlinkSync(filePath);  
                    
                    // 🔴 CORRECTION : On lance startpairing sans 'await' pour libérer Telegram
                    startpairing(data.jid, teleId, data.name).catch(e => {
                        console.error(`[WATCHER] ❌ Erreur critique startpairing pour ${data.jid}:`, e);
                    }); 
                } catch (e) {  
                    console.error("[WATCHER] ❌ Erreur traitement demande:", e);  
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
            console.log(`[RESTORE] 🔄 Restauration de la session: ${folder}`);
            startpairing(folder).catch((e) => {
                console.error(`[RESTORE] ❌ Erreur restauration ${folder}:`, e);
            });
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
    console.log(`[CLEANUP] 🧹 Nettoyage forcé pour ${number}`);
    const sessionPath = path.join(PAIRING_DIR, number);
    const pairingFile = path.join(PAIRING_DIR, `pairing_${teleId}.json`);
    
    if (fs.existsSync(sessionPath)) deleteFolderRecursive(sessionPath);
    if (fs.existsSync(pairingFile)) fs.unlinkSync(pairingFile);
    
    if (rentbotTracker.has(number)) {
        const tracker = rentbotTracker.get(number);
        if (tracker.connection) { 
            try { 
                tracker.connection.ev.removeAllListeners("connection.update");
                tracker.connection.ev.removeAllListeners("creds.update");
                tracker.connection.end(); 
            } catch (e) {
                console.error(`[CLEANUP] ⚠️ Erreur fermeture socket ${number}:`, e.message);
            } 
        }
        rentbotTracker.delete(number);
    }
}

export default async function startpairing(nexusDevNumber, teleId = "default", userName = "Unknown", attempt = 0) {
    const number = nexusDevNumber.replace(/[^0-9]/g, "");
    if (!number) throw new Error("Invalid phone number");

    // Génération d'un ID unique pour pister cette tentative précise
    const instanceId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const logPrefix = `[${number} | ID:${instanceId}]`;

    console.log(`${logPrefix} 🚀 Initialisation startpairing (Tentative: ${attempt})`);

    // SÉCURITÉ ANTI-CONCURRENCE : Si une session est DÉJÀ en cours de démarrage, on stoppe
    if (rentbotTracker.has(number) && rentbotTracker.get(number).status === 'starting') {
        console.log(`${logPrefix} 🛑 Une session est déjà en cours de lancement pour ce numéro. Annulation.`);
        return;
    }

    if (rentbotTracker.has(number)) {  
        const tracker = rentbotTracker.get(number);  
        if (tracker.connection) { 
            console.log(`${logPrefix} 🔪 Fermeture de l'ancienne instance existante...`);
            try { 
                tracker.connection.ev.removeAllListeners("connection.update");
                tracker.connection.ev.removeAllListeners("creds.update");
                tracker.connection.ev.removeAllListeners("messages.upsert");
                tracker.connection.ws.close(); 
                tracker.connection.end(); 
            } catch (e) {
                console.log(`${logPrefix} ⚠️ Erreur lors de la fermeture de l'ancienne instance:`, e.message);
            } 
        }  
    }  

    let isReady = false;   
    rentbotTracker.set(number, { connection: null, isConnected: false, status: 'starting' });  
    const tracker = rentbotTracker.get(number);  
    
    const sessionPath = path.join(PAIRING_DIR, number);  
    if (!fs.existsSync(sessionPath)) {
        console.log(`${logPrefix} 📁 Création du dossier de session...`);
        fs.mkdirSync(sessionPath, { recursive: true });  
    }

    console.log(`${logPrefix} 🔑 Chargement de l'état d'authentification...`);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);  
      
    await sleep(2000);   

    // Changement ici : le logger n'est plus "silent", il va afficher les erreurs graves de Baileys
    const kaya = makeWASocket({  
        logger: pino({ level: "warn" }), // "warn" affichera les erreurs de déchiffrement sans spammer
        printQRInTerminal: false,  
        auth: state,  
        browser: Browsers.macOS("Chrome"),  
        connectTimeoutMs: 60000,   
        defaultQueryTimeoutMs: 60000,  
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
                await cmd.detect(kaya, update, groupId).catch((e) => console.error(`${logPrefix} ❌ Erreur group-participants:`, e));  
            }  
        } catch (err) {}  
    });  

    if (!state.creds.registered) {  
        console.log(`${logPrefix} ⏳ Appareil non enregistré. Demande de code de pairage dans 5s...`);
        setTimeout(async () => {  
            try {  
                if (rentbotTracker.get(number)?.connection !== kaya) {
                    console.log(`${logPrefix} 🛑 Instance obsolète avant demande de code.`);
                    return;
                }
                
                let code = await kaya.requestPairingCode(number);  
                code = code?.match(/.{1,4}/g)?.join("-") || code;  
                console.log(`${logPrefix} 📟 Code de pairage généré: ${code}`);

                fs.writeFileSync(path.join(PAIRING_DIR, `pairing_${teleId}.json`), JSON.stringify({ number: nexusDevNumber, code, userName, timestamp: new Date().toISOString() }, null, 2));  
            } catch (err) {
                console.error(`${logPrefix} ❌ Erreur génération code de pairage:`, err.message);
            }  
        }, 5000);  
    } else {
        console.log(`${logPrefix} ✅ Appareil déjà enregistré, tentative de connexion...`);
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
        } catch (err) { 
            console.error(`${logPrefix} ❌ Erreur dans le handler de messages:`, err); 
        }  
    });  

    kaya.ev.on("connection.update", async (update) => {  
        const { connection, lastDisconnect, isNewLogin } = update;  
        
        if (connection || isNewLogin) {
            console.log(`${logPrefix} 🔄 Status: ${connection || 'Mise à jour'} | isNewLogin: ${!!isNewLogin}`);
        }
          
        if (connection === "open") {  
            if (rentbotTracker.get(number)?.connection !== kaya) {
                console.log(`${logPrefix} 🛑 Connexion ouverte mais l'instance a été remplacée. Arrêt.`);
                return;
            }

            console.log(`${logPrefix} 🟢 CONNEXION RÉUSSIE ET STABLE`);
            isReady = true;  
            attempt = 0;   
            tracker.status = 'connected'; // On met à jour le statut

            if (!tracker.isConnected) {  
                tracker.isConnected = true;  
                const msg = connectionMessage();  
                await sleep(2000);  
                
                // 🔴 CORRECTION ICI : Remplacement de nexusDevNumber par number
                await kaya.sendMessage(number + "@s.whatsapp.net", { text: msg }).catch(e => console.error(`${logPrefix} ❌ Erreur message de bienvenue:`, e));  
            }  
        }  
          
        if (connection === "close") {  
            isReady = false;  
            tracker.isConnected = false;  

            if (rentbotTracker.get(number)?.connection !== kaya) {
                console.log(`${logPrefix} 🛑 Ancienne instance ignorée lors de la déconnexion.`);
                return;
            }

            const error = lastDisconnect?.error;
            const reason = new Boom(error)?.output?.statusCode;  
            
            console.log(`${logPrefix} 🔴 DÉCONNEXION. Code: ${reason}`);
            console.log(`${logPrefix} 🔍 Détail de l'erreur Baileys:`, error?.message || error);
              
            if (reason === DisconnectReason.loggedOut) {  
                console.log(`${logPrefix} 🛑 Déconnexion volontaire (loggedOut), nettoyage total.`);  
                forceCleanupSession(number, teleId);  
            } else {  
                const backoffDelay = Math.min(10000 * (attempt + 1), 60000);  
                console.log(`${logPrefix} ⚠️ Reconnexion prévue dans ${backoffDelay/1000}s...`);  
                
                tracker.status = 'reconnecting';

                await sleep(backoffDelay);  
                
                if (rentbotTracker.get(number)?.connection !== kaya) {
                    console.log(`${logPrefix} 🛑 Annulation de la reconnexion, une nouvelle instance a pris le relais.`);
                    return;
                }

                startpairing(nexusDevNumber, teleId, userName, attempt + 1);  
            }  
        }  
    });  

    kaya.ev.on("creds.update", () => {
        if (rentbotTracker.get(number)?.connection === kaya) {
            saveCreds();
            // Retiré le log de creds car il spamme la console à chaque message reçu,
            // mais l'enregistrement est sécurisé pour cette instance uniquement.
        }
    });  
    
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
