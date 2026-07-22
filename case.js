// case.js
import { getContentType } from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import chalk from "chalk";
import decodeJid from "./setting/decodeJid.js"; 
import checkAdminOrOwner from "./setting/checkAdminOrOwner.js";
import { getSetting } from "./setting.js";
// ✅ IMPORTATION DE LA SÉCURITÉ EXTERNE
import { sendLimited, randomDelay } from './utils/kayaUtils.js';

const __dirname = path.resolve();
export const commands = new Map();
const commandsPath = path.join(__dirname, "commands");

// Trackers locaux pour la sécurité
const presenceTracker = new Map();
const cooldownTracker = new Map(); // ✅ Anti-Flood : 5 secondes par utilisateur

// ================= CHARGEMENT DES COMMANDES =================
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {  
        try {
            const fileUrl = pathToFileURL(path.join(commandsPath, file)).href; 
            const cmdModule = await import(fileUrl);  
            const cmd = cmdModule.default || cmdModule; 
            if (cmd.name) commands.set(cmd.name, cmd);
            if (cmd.alias && Array.isArray(cmd.alias)) cmd.alias.forEach(a => commands.set(a, cmd));
        } catch (error) { console.error(chalk.red(`[ERREUR] Impossible de charger ${file}:`), error); }
    }
}

export default async function caseHandler(kaya, mek, chatUpdate, store = null) {
    try {
        // ✅ PATCH GLOBAL : On sécurise kaya.sendMessage pour TOUT le bot via l'utilitaire externe
        if (!kaya._patched) {
            const originalSend = kaya.sendMessage;
            kaya.sendMessage = async (jid, content, options = {}) => {
                return await sendLimited(kaya, originalSend, jid, content, options);
            };
            kaya._patched = true;
        }

        // Ajout de la méthode explicite au cas où
        kaya.sendMessageLimited = kaya.sendMessage;

        if (!mek.message || mek.key.id.startsWith("BAE5")) return;

        const sender = mek.sender;
        const from = mek.key.remoteJid;
        const isGroup = from.endsWith("@g.us");
        const ownerId = kaya.user.id.split(':')[0];
        const groupId = from.split('@')[0];

        // 🔹 1. Simulation de présence HUMAINE
        const lastPresence = presenceTracker.get(from) || 0;
        if (Math.random() > 0.4 && (Date.now() - lastPresence > 30000)) {
            if (getSetting(ownerId, 'typing', false)) {
                await kaya.sendPresenceUpdate('composing', from).catch(() => {});
                presenceTracker.set(from, Date.now());
            }
            if (getSetting(ownerId, 'recording', false)) {
                await kaya.sendPresenceUpdate('recording', from).catch(() => {});
                presenceTracker.set(from, Date.now());
            }
        }
        
        // 🔹 2. Auto-Réaction PRIORITAIRE
        const autoReact = commands.get("autoreact");
        if (autoReact && getSetting(ownerId, 'autoreact', false) && autoReact.listen) {
            await autoReact.listen(kaya, mek, from).catch(() => {});
        }

        if (getSetting(ownerId, `banned_${sender}`, false)) return;

        // 🔹 Extraction robuste du texte (Faite en amont pour alimenter les sécurités)
        const type = getContentType(mek.message);
        let body = (type === "conversation") ? mek.message.conversation : 
                   (type === "extendedTextMessage") ? (mek.message.extendedTextMessage.text || mek.message.extendedTextMessage.contextInfo?.externalAdReply?.body || "") :
                   (type === "imageMessage") ? mek.message.imageMessage.caption : 
                   (type === "videoMessage") ? mek.message.videoMessage.caption : "";

        // ✅ 3. EXÉCUTION DES UTILITAIRES (Anti-Link, Anti-Status, etc.) EN PRIORITÉ
        // Pour que la sécurité fonctionne même si le mode privé est activé pour les commandes
        await executeUtilities(kaya, mek, from, body, ownerId, groupId);

        // 🔹 4. Mode privé global (Bloque uniquement les commandes pour les non-propriétaires)
        if (!mek.key.fromMe) {
            const privateMode = getSetting(ownerId, 'privateMode', false);
            const blockInbox = getSetting(ownerId, 'blockInbox', false);
            const userPrefix = getSetting(ownerId, 'prefix', '.');
            const isPairCommand = body.startsWith(`${userPrefix}pair`);

            if (!isPairCommand) {
                if (privateMode || (blockInbox && !isGroup)) {
                    const status = await checkAdminOrOwner(kaya, from, sender);
                    if (!status.isBotOwner) return; // Stoppe ici si c'est une commande d'un non-owner en mode privé
                }
            }
        }

        if (!body) return;

        const userPrefix = getSetting(ownerId, 'prefix', '.');
        const isAllPrefixEnabled = Boolean(getSetting(ownerId, 'allPrefix', true));
        let prefix = null;
        if (body.trim().startsWith(userPrefix)) prefix = userPrefix;
        else if (isAllPrefixEnabled) {
            const match = body.trim().match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#%^&.©^]/);
            if (match) prefix = match[0];
        }

        if (!prefix) return;

        const args = body.trim().slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const cmd = commands.get(command);
        if (!cmd) return;

        const status = await checkAdminOrOwner(kaya, from, mek.sender);  
        if (cmd.ownerOnly && !status.isBotOwner) return await kaya.sendMessage(from, { text: "❌ Owner only." }, { quoted: mek });  
        if (cmd.group && !isGroup) return await kaya.sendMessage(from, { text: "❌ Group only." }, { quoted: mek });  
        if (cmd.admin && !status.isAdmin) return await kaya.sendMessage(from, { text: "❌ Admin only." }, { quoted: mek });  

        // ✅ SÉCURITÉ ANTI-FLOOD : 5 secondes d'attente entre chaque commande (Exemption pour le Owner)
        if (!status.isBotOwner) {
            const lastCommandTime = cooldownTracker.get(sender) || 0;
            if (Date.now() - lastCommandTime < 5000) { 
                console.log(chalk.yellow(`[ANTI-FLOOD] Commande .${command} ignorée pour ${sender}`));
                return; 
            }
            cooldownTracker.set(sender, Date.now());
        }

        // Délai humain pour les utilisateurs, court pour le propriétaire
        if (status.isBotOwner) {
            await new Promise(r => setTimeout(r, 500)); 
        } else {
            await randomDelay(1000, 2500); 
        }

        if (cmd.botAdmin) {  
            const metadata = await kaya.groupMetadata(from).catch(() => null);
            if (!metadata) return await kaya.sendMessage(from, { text: "❌ Error reading group metadata." });
            const botNumber = decodeJid(kaya.user.id).split('@')[0];
            const botData = metadata.participants.find(p => (p.phoneNumber || decodeJid(p.id)).split('@')[0] === botNumber);
            if (!botData || botData.admin === null) return await kaya.sendMessage(from, { text: "❌ Bot must be admin." }, { quoted: mek });  
        }  

        console.log(chalk.black(chalk.bgWhite("[ CMD ]")), chalk.green(command), "from", chalk.blue(mek.pushName || from));  

        if (typeof cmd.execute === "function") await cmd.execute(kaya, mek, from, args, prefix);
        else if (typeof cmd.run === "function") await cmd.run(kaya, mek, args, prefix);

    } catch (err) { console.error(chalk.red("[ERROR case.js]:"), err); }
}

async function executeUtilities(kaya, mek, from, body, ownerId, groupId) {
    const utils = [
        { name: "antibot", setting: "antibot" }, 
        { name: "antilink", setting: "antilink" }, 
        { name: "antitag", setting: "antitag" }, 
        { name: "antispam", setting: "antispam" },
        { name: "antistatus", setting: "antistatus" },
        { name: "antimention", setting: "antimention" }
    ];
    
    for (const utilConf of utils) {
        const isEnabled = getSetting(ownerId, utilConf.setting, false, groupId);
        if (isEnabled) {
            const util = commands.get(utilConf.name);
            if (util && util.detect) {
                try { 
                    await util.detect(kaya, mek, from, body); 
                } catch (e) { 
                    console.error(`❌ Error in ${utilConf.name}:`, e); 
                }
            }
        }
    }
}
