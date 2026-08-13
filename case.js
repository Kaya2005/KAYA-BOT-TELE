// ==================== case.js ====================
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
// ✅ IMPORTATION DU STOCKAGE ANTI-DELETE
import { storeMessage } from "./commands/antidelete.js";

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
            const cmdAliases = cmd.aliases || cmd.alias;
            if (cmdAliases && Array.isArray(cmdAliases)) {
                cmdAliases.forEach(a => commands.set(a, cmd));
            }
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

        // 🛡️ SÉCURITÉ : Vérification stricte que l'objet message et sa clé existent avant de lire .id
        if (!mek || !mek.message || !mek.key || !mek.key.id || mek.key.id.startsWith("BAE5")) return;

        const sender = mek.sender;
        const from = mek.key.remoteJid;
        if (!from) return;

        const isGroup = from.endsWith("@g.us");
        const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
        const groupId = from.split('@')[0];

        // ✅ ENREGISTREMENT DU MESSAGE POUR L'ANTI-DELETE (Seulement si l'option est activée)
        if (getSetting(ownerId, 'antidelete', false, isGroup ? groupId : null)) {
            storeMessage(kaya, mek);
        }

        // 🌟 GESTION DES STATUTS WHATSAPP (status@broadcast)
        if (from === 'status@broadcast') {
            const autostatus = commands.get('autostatus');
            if (autostatus && typeof autostatus.detect === 'function') {
                await autostatus.detect(kaya, mek, from).catch(() => {});
            }
            return; 
        }

        // 🔹 Extraction robuste et sécurisée du texte (avec support des boutons interactifs Baileys 7.x)
        const type = getContentType(mek.message);
        let body = "";
        
        // Interception des clics sur les boutons interactifs
        if (type === "interactiveResponseMessage") {
            const paramsJson = mek.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
            if (paramsJson) {
                try {
                    const parsed = JSON.parse(paramsJson);
                    body = parsed.id || "";
                } catch (e) {}
            }
        } else if (type === "templateButtonReplyMessage") {
            body = mek.message.templateButtonReplyMessage?.selectedId || "";
        } else if (type === "buttonsResponseMessage") {
            body = mek.message.buttonsResponseMessage?.selectedButtonId || "";
        } else if (type === "conversation") {
            body = mek.message.conversation || "";
        } else if (type === "extendedTextMessage") {
            body = mek.message.extendedTextMessage?.text || mek.message.extendedTextMessage?.contextInfo?.externalAdReply?.body || "";
        } else if (type === "imageMessage") {
            body = mek.message.imageMessage?.caption || "";
        } else if (type === "videoMessage") {
            body = mek.message.videoMessage?.caption || "";
        }

        // 🔍 VÉRIFICATION PRÉALABLE : Est-ce une commande valide ?
        let isCommand = false;
        let commandName = "";
        let prefix = "";
        let args = [];

        if (body) {
            const trimmedBody = body.trim();
            const splitArgs = trimmedBody.split(/ +/);
            const firstWord = splitArgs[0]?.toLowerCase();

            const userPrefix = getSetting(ownerId, 'prefix', '.');
            const isAllPrefixEnabled = Boolean(getSetting(ownerId, 'allPrefix', true));
            const noPrefixEnabled = getSetting(ownerId, 'noPrefix', false);
            
            if (noPrefixEnabled) {
                if (commands.has(firstWord)) {
                    prefix = '';
                    args = splitArgs;
                    commandName = firstWord;
                    isCommand = true;
                }
            } else {
                if (trimmedBody.startsWith(userPrefix)) {
                    prefix = userPrefix;
                    args = trimmedBody.slice(prefix.length).trim().split(/ +/);
                    const rawCmd = args[0]?.toLowerCase();
                    if (rawCmd && commands.has(rawCmd)) {
                        commandName = rawCmd;
                        isCommand = true;
                    }
                } else if (isAllPrefixEnabled && /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#%^&.©^]/.test(trimmedBody)) {
                    const match = trimmedBody.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#%^&.©^]/);
                    if (match) {
                        prefix = match[0];
                        args = trimmedBody.slice(prefix.length).trim().split(/ +/);
                        const rawCmd = args[0]?.toLowerCase();
                        if (rawCmd && commands.has(rawCmd)) {
                            commandName = rawCmd;
                            isCommand = true;
                        }
                    }
                }
            }
        }

        // 🛡️ VÉRIFICATION DES UTILITAIRES ACTIFS (Anti-Link, Anti-Bot, Anti-Spam, etc.)
        const utilsList = ["antibot", "antilink", "antitag", "antispam", "antistatus", "antimention"];
        let hasActiveUtility = false;

        for (const utilName of utilsList) {
            if (getSetting(ownerId, utilName, false, groupId)) {
                hasActiveUtility = true;
                break;
            }
        }

        // 🤖 VÉRIFICATION DU CHATBOT (Ignore les images, stickers, etc.)
        const chatbotMode = getSetting(ownerId, 'chatbot_mode', 'off');
        const isChatbotActive = chatbotMode !== 'off';
        
        if (!isCommand && isChatbotActive) {
            const isMedia = ["imageMessage", "videoMessage", "stickerMessage", "documentMessage", "audioMessage"].includes(type);
            if (!isMedia && body) {
                const chatbotModule = commands.get("chatbot");
                if (chatbotModule && typeof chatbotModule.listen === "function") {
                    await chatbotModule.listen(kaya, mek, from, body, ownerId);
                }
            }
        }

        // 🛑 OPTIMISATION MAJEURE : Si ce n'est PAS une commande, qu'aucun utilitaire et que le chatbot ne réagit pas, on ignore !
        if (!isCommand && !hasActiveUtility && !isChatbotActive) {
            return; 
        }

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

        // ✅ 3. EXÉCUTION DES UTILITAIRES
        await executeUtilities(kaya, mek, from, body, ownerId, groupId);

        if (!isCommand) return;

        // 🔍 ÉVALUATION DES PRIVILÈGES (Owner ou Sudo)
        const status = await checkAdminOrOwner(kaya, from, sender);  
        const sudoList = getSetting(ownerId, 'sudo_list', []);
        const isSudo = sudoList.includes(sender);

        // 🔹 4. Mode privé global (Bloque les non-propriétaires ET non-sudo)
        if (!mek.key.fromMe) {
            const privateMode = getSetting(ownerId, 'privateMode', false);
            const blockInbox = getSetting(ownerId, 'blockInbox', false);
            const userPrefix = getSetting(ownerId, 'prefix', '.');
            const isPairCommand = body.startsWith(`${userPrefix}pair`) || body.startsWith('pair');

            if (!isPairCommand) {
                if (privateMode || (blockInbox && !isGroup)) {
                    if (!status.isBotOwner && !isSudo) return; 
                }
            }
        }

        if (getSetting(ownerId, `banned_${sender}`, false)) return;

        const rawCommand = args.shift();
        if (!rawCommand) return;
        const command = rawCommand.toLowerCase();
        const cmd = commands.get(command);
        if (!cmd) return;

        // 👑 Restriction Owner/Sudo
        if (cmd.ownerOnly && !status.isBotOwner && !isSudo) {
            return await kaya.sendMessage(from, { text: "Owner or Sudo only." }, { quoted: mek });  
        }
        if (cmd.group && !isGroup) return await kaya.sendMessage(from, { text: "Group only." }, { quoted: mek });  
        if (cmd.admin && !status.isAdmin) return await kaya.sendMessage(from, { text: "Admin only." }, { quoted: mek });  

        // ✅ SÉCURITÉ ANTI-FLOOD (Désormais appliqué à TOUT LE MONDE, y compris l'Owner)
        const lastCommandTime = cooldownTracker.get(sender) || 0;
        if (Date.now() - lastCommandTime < 5000) { 
            console.log(chalk.yellow(`[ANTI-FLOOD] Commande ${command} ignorée pour ${sender}`));
            return; 
        }
        cooldownTracker.set(sender, Date.now());

        // ✅ DÉLAI D'EXÉCUTION DYNAMIQUE BASÉ SUR LE PROFIL DE VITESSE
        const speedProfile = getSetting(ownerId, 'botSpeed', '5-8');
        let dMin = 3000, dMax = 6000;
        switch (speedProfile) {
            case '1-2': dMin = 1000; dMax = 2000; break;
            case '2-3': dMin = 2000; dMax = 3000; break;
            case '3-4': dMin = 3000; dMax = 4000; break;
            case '4-6': dMin = 4000; dMax = 6000; break;
            case '5-8': dMin = 5000; dMax = 8000; break;
            case '6-10': dMin = 6000; dMax = 10000; break;
            case '8-10': dMin = 8000; dMax = 10000; break;
            case '10-15': dMin = 10000; dMax = 15000; break;
        }
        await randomDelay(dMin, dMax); 

        if (cmd.botAdmin) {  
            const metadata = await kaya.groupMetadata(from).catch(() => null);
            if (!metadata) return await kaya.sendMessage(from, { text: "Error reading group metadata." });
            const botNumber = decodeJid(kaya.user.id).split('@')[0];
            const botData = metadata.participants.find(p => (p.phoneNumber || decodeJid(p.id)).split('@')[0] === botNumber);
            if (!botData || botData.admin === null) return await kaya.sendMessage(from, { text: "Bot must be admin." }, { quoted: mek });  
        }  

        console.log(chalk.black(chalk.bgWhite("[ CMD ]")), chalk.green(command), "from", chalk.blue(mek.pushName || from));  

        // 🛡️ EXÉCUTION SÉCURISÉE DE LA COMMANDE
        try {
            if (typeof cmd.execute === "function") {
                await cmd.execute(kaya, mek, from, args, prefix);
            } else if (typeof cmd.run === "function") {
                await cmd.run(kaya, mek, args, prefix);
            }
        } catch (cmdErr) {
            console.error(chalk.red(`[ERREUR COMMANDE] (${command}):`), cmdErr.stack || cmdErr);
            await kaya.sendMessage(from, { text: `❌ Une erreur critique est survenue lors de l'exécution de la commande **${command}**.` }, { quoted: mek }).catch(() => {});
        }

    } catch (err) { 
        console.error(chalk.red("[ERROR case.js]:"), err.stack || err); 
    }
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
                    console.error(`Error in ${utilConf.name}:`, e); 
                }
            }
        }
    }
}
