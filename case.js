// case.js
import { getContentType } from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import chalk from "chalk";
import decodeJid from "./setting/decodeJid.js"; 
import checkAdminOrOwner from "./setting/checkAdminOrOwner.js";
import { getSetting } from "./setting.js";

const __dirname = path.resolve();
// Exportation de la Map pour accès depuis le fichier principal
export const commands = new Map();
const commandsPath = path.join(__dirname, "commands");

// ================= CHARGEMENT DES COMMANDES ET ALIAS =================
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {  
        try {
            const fileUrl = pathToFileURL(path.join(commandsPath, file)).href; 
            const cmdModule = await import(fileUrl);  
            const cmd = cmdModule.default || cmdModule; 
            
            if (cmd.name) commands.set(cmd.name, cmd);
            if (cmd.alias && Array.isArray(cmd.alias)) {
                cmd.alias.forEach(alias => commands.set(alias, cmd));
            }
        } catch (error) {
            console.error(chalk.red(`[ERREUR] Impossible de charger ${file}:`), error);
        }
    }
}

export default async function caseHandler(kaya, mek, chatUpdate, store) {
    try {
        if (!mek.message) return;
        if (mek.key.id.startsWith("BAE5")) return;

        const sender = mek.sender;
        const from = mek.key.remoteJid;
        const isGroup = from.endsWith("@g.us");
        const botJid = kaya.user.id;

        // 🔹 1. Simulation de présence PRIORITAIRE
        if (getSetting(sender, 'typing', false)) await kaya.sendPresenceUpdate('composing', from).catch(() => {});
        if (getSetting(sender, 'recording', false)) await kaya.sendPresenceUpdate('recording', from).catch(() => {});
        
        // 🔹 2. Auto-Réaction PRIORITAIRE
        const autoReact = commands.get("autoreact");
        if (autoReact && getSetting(sender, 'autoreact', false) && autoReact.listen) {
            await autoReact.listen(kaya, mek, from).catch(() => {});
        }

        // 🚫 Vérification du bannissement
        if (getSetting(sender, 'isBanned', false)) return;

    // 🔒 Gestion des messages privés du bot
if (!isGroup && !mek.key.fromMe) {

    const privateMode = getSetting(botJid, 'privateMode', false);
    const blockInbox = getSetting(botJid, 'blockInbox', false);

    // Vérification propriétaire seulement si nécessaire
    if (privateMode || blockInbox) {
        const status = await checkAdminOrOwner(kaya, from, sender);

        // Mode privé : seul le propriétaire peut utiliser le bot
        if (privateMode && !status.isBotOwner) {
            return;
        }

        // Block Inbox : bloque les privés sauf propriétaire
        if (blockInbox && !status.isBotOwner) {
            return;
        }
    }
}

        // 🔹 Extraction du contenu
        const type = getContentType(mek.message);
        let body = (type === "conversation" ? mek.message.conversation : 
                    type === "extendedTextMessage" ? mek.message.extendedTextMessage.text : 
                    type === "imageMessage" ? mek.message.imageMessage.caption : 
                    type === "videoMessage" ? mek.message.videoMessage.caption : "");

        // 🔹 Exécution des autres utilitaires
        await executeUtilities(kaya, mek, from, body);

        if (!body) return;

        // 🔹 Détection préfixe
        const userPrefix = getSetting(botJid, 'prefix', '.');
        const isAllPrefixEnabled = Boolean(getSetting(botJid, 'allPrefix', true));
        
        let prefix = null;
        if (body.trim().startsWith(userPrefix)) {
            prefix = userPrefix;
        } else if (isAllPrefixEnabled) {
            const match = body.trim().match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#%^&.©^]/);
            if (match) prefix = match[0];
        }

        if (!prefix) return;

        const args = body.trim().slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const cmd = commands.get(command);
        
        if (!cmd) return;

        // ================= PERMISSIONS OPTIMISÉES =================  
        const status = await checkAdminOrOwner(kaya, from, mek.sender);  

        if (cmd.ownerOnly && !status.isBotOwner) {  
            return kaya.sendMessage(from, { text: "❌ This command is for the owner only." }, { quoted: mek });  
        }  
        if (cmd.group && !isGroup) {  
            return kaya.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: mek });  
        }  
        if (cmd.admin && !status.isAdmin) {  
            return kaya.sendMessage(from, { text: "❌ This command is for admins only." }, { quoted: mek });  
        }  

        if (cmd.botAdmin) {  
            const metadata = await kaya.groupMetadata(from).catch(() => null);
            if (!metadata) return kaya.sendMessage(from, { text: "❌ Erreur: Impossible de lire les infos du groupe." });
            
            const botNumber = decodeJid(botJid).split('@')[0];
            const botData = metadata.participants.find(p => {
                const pNum = (p.phoneNumber || decodeJid(p.id)).split('@')[0];
                return pNum === botNumber;
            });
            
            if (!botData || botData.admin === null) {  
                return kaya.sendMessage(from, { text: "❌ I need to be admin to use this command." }, { quoted: mek });  
            }  
        }  

        console.log(chalk.black(chalk.bgWhite("[ CMD ]")), chalk.green(command), "from", chalk.blue(mek.pushName || from));  

        // 🔹 Exécution
        if (typeof cmd.execute === "function") await cmd.execute(kaya, mek, from, args, prefix);
        else if (typeof cmd.run === "function") await cmd.run(kaya, mek, args, prefix);

    } catch (err) { console.error(chalk.red("[ERROR case.js]:"), err); }
}

async function executeUtilities(kaya, mek, from, body) {
    const utils = [
        { name: "antibot", setting: "antibot", scope: "group" },
        { name: "antilink", setting: "antilink", scope: "group" },
        { name: "antitag", setting: "antitag", scope: "group" },
        { name: "antispam", setting: "antispam", scope: "group" }
    ];

    for (const utilConf of utils) {
        const targetId = utilConf.scope === "user" ? mek.sender : from;
        if (getSetting(targetId, utilConf.setting, false)) {
            const util = commands.get(utilConf.name);
            if (util && util.detect) {
                try {
                    await util.detect(kaya, mek, from, body);
                } catch (e) {
                    console.error(`❌ Error in utility ${utilConf.name}:`, e);
                }
            }
        }
    }
}
