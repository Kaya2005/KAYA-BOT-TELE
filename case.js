import { getContentType } from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import chalk from "chalk";
import decodeJid from "./setting/decodeJid.js"; 
import checkAdminOrOwner from "./setting/checkAdminOrOwner.js";
import { getSetting } from "./setting.js";

const __dirname = path.resolve();
export const commands = new Map();
const commandsPath = path.join(__dirname, "commands");

// Fonction utilitaire ajoutée pour le délai (Anti-Ban)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        
        const ownerId = kaya.user.id.split(':')[0];
        const groupId = from.split('@')[0];

        // 🔹 1. Simulation de présence HUMAINE (Aléatoire pour éviter le ban)
        if (Math.random() > 0.4) {
            if (getSetting(ownerId, 'typing', false)) {
                await kaya.sendPresenceUpdate('composing', from).catch(() => {});
                await delay(Math.floor(Math.random() * 1000) + 1000);
            }
            if (getSetting(ownerId, 'recording', false)) {
                await kaya.sendPresenceUpdate('recording', from).catch(() => {});
                await delay(Math.floor(Math.random() * 2000) + 1000);
            }
        }
        
        // 🔹 2. Auto-Réaction PRIORITAIRE
        const autoReact = commands.get("autoreact");
        if (autoReact && getSetting(ownerId, 'autoreact', false) && autoReact.listen) {
            await autoReact.listen(kaya, mek, from).catch(() => {});
        }

        if (getSetting(ownerId, `banned_${sender}`, false)) return;

        if (!isGroup && !mek.key.fromMe) {
            const privateMode = getSetting(ownerId, 'privateMode', false);
            const blockInbox = getSetting(ownerId, 'blockInbox', false);

            if (privateMode || blockInbox) {
                const status = await checkAdminOrOwner(kaya, from, sender);
                if (privateMode && !status.isBotOwner) return;
                if (blockInbox && !status.isBotOwner) return;
            }
        }

        const type = getContentType(mek.message);
        let body = (type === "conversation" ? mek.message.conversation : 
                    type === "extendedTextMessage" ? mek.message.extendedTextMessage.text : 
                    type === "imageMessage" ? mek.message.imageMessage.caption : 
                    type === "videoMessage" ? mek.message.videoMessage.caption : "");

        await executeUtilities(kaya, mek, from, body, ownerId, groupId);

        if (!body) return;

        const userPrefix = getSetting(ownerId, 'prefix', '.');
        const isAllPrefixEnabled = Boolean(getSetting(ownerId, 'allPrefix', true));
        
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

        // Délai anti-spam global ajouté ici
        await delay(Math.floor(Math.random() * 1000) + 500);

        if (cmd.botAdmin) {  
            const metadata = await kaya.groupMetadata(from).catch(() => null);
            if (!metadata) return kaya.sendMessage(from, { text: "❌ Erreur: Impossible de lire les infos du groupe." });
            
            const botNumber = decodeJid(kaya.user.id).split('@')[0];
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

async function executeUtilities(kaya, mek, from, body, ownerId, groupId) {
    const utils = [
        { name: "antibot", setting: "antibot", scope: "group" },
        { name: "antilink", setting: "antilink", scope: "group" },
        { name: "antitag", setting: "antitag", scope: "group" },
        { name: "antispam", setting: "antispam", scope: "group" }
    ];

    for (const utilConf of utils) {
        const isEnabled = getSetting(ownerId, utilConf.setting, false, groupId);
        
        if (isEnabled) {
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
