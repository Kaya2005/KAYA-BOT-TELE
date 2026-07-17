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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ================= CHARGEMENT DES COMMANDES =================
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {  
        try {
            const fileUrl = pathToFileURL(path.join(commandsPath, file)).href; 
            const cmdModule = await import(fileUrl);  
            const cmd = cmdModule.default || cmdModule; 
            if (cmd.name) commands.set(cmd.name, cmd);
            if (cmd.alias && Array.isArray(cmd.alias)) cmd.alias.forEach(alias => commands.set(alias, cmd));
        } catch (error) { console.error(chalk.red(`[ERREUR] Impossible de charger ${file}:`), error); }
    }
}

export default async function caseHandler(kaya, mek, chatUpdate, store = null) {
    try {
        if (!mek.message) return;
        if (mek.key.id.startsWith("BAE5")) return;

        const sender = mek.sender;
        const from = mek.key.remoteJid;
        const isGroup = from.endsWith("@g.us");
        const botJid = kaya.user.id;
        const ownerId = botJid.split(':')[0];
        const groupId = from.split('@')[0];

        // 1. Simulation présence
        if (Math.random() > 0.4) {
            if (getSetting(ownerId, 'typing', false)) { await kaya.sendPresenceUpdate('composing', from).catch(() => {}); await delay(1000); }
            if (getSetting(ownerId, 'recording', false)) { await kaya.sendPresenceUpdate('recording', from).catch(() => {}); await delay(1000); }
        }
        
        // 2. Extraction du texte (ROBUSTE)
        const type = getContentType(mek.message);
        let body = (type === "conversation") ? mek.message.conversation : 
                   (type === "extendedTextMessage") ? (mek.message.extendedTextMessage.text || mek.message.extendedTextMessage.contextInfo?.externalAdReply?.body || "") :
                   (type === "imageMessage") ? mek.message.imageMessage.caption : 
                   (type === "videoMessage") ? mek.message.videoMessage.caption : "";
        
        if (!body && mek.message?.extendedTextMessage?.contextInfo?.externalAdReply?.sourceUrl) {
            body = mek.message.extendedTextMessage.contextInfo.externalAdReply.sourceUrl;
        }

        // 3. EXÉCUTION UTILS (Avant le return de sécurité)
        // On passe 'from' comme identifiant de contexte pour que le bot 
        // sache dans quel groupe il doit vérifier si l'option est active.
        await executeUtilities(kaya, mek, from, body, ownerId, groupId);

        // Sécurités après détection
        if (getSetting(ownerId, `banned_${sender}`, false)) return;
        if (!mek.key.fromMe) {
            const privateMode = getSetting(ownerId, 'privateMode', false);
            const blockInbox = getSetting(ownerId, 'blockInbox', false);
            const bodyText = body.trim();
            const userPrefix = getSetting(ownerId, 'prefix', '.');
            if (!bodyText.startsWith(`${userPrefix}pair`)) {
                if ((privateMode || (blockInbox && !isGroup)) && !(await checkAdminOrOwner(kaya, from, sender)).isBotOwner) return;
            }
        }

        if (!body) return;

        // 4. Exécution commandes
        const userPrefix = getSetting(ownerId, 'prefix', '.');
        const isAllPrefixEnabled = Boolean(getSetting(ownerId, 'allPrefix', true));
        let prefix = body.trim().startsWith(userPrefix) ? userPrefix : (isAllPrefixEnabled ? (body.trim().match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#%^&.©^]/) || [])[0] : null);
        if (!prefix) return;

        const args = body.trim().slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const cmd = commands.get(command);
        if (!cmd) return;

        // Permissions
        const status = await checkAdminOrOwner(kaya, from, sender);
        if (cmd.ownerOnly && !status.isBotOwner) return kaya.sendMessage(from, { text: "❌ Owner only." }, { quoted: mek });
        if (cmd.group && !isGroup) return kaya.sendMessage(from, { text: "❌ Group only." }, { quoted: mek });
        if (cmd.admin && !status.isAdmin) return kaya.sendMessage(from, { text: "❌ Admin only." }, { quoted: mek });

        if (cmd.botAdmin) {
            const metadata = await kaya.groupMetadata(from).catch(() => null);
            if (!metadata) return;
            const botNumber = decodeJid(botJid).split('@')[0];
            if (!metadata.participants.find(p => (p.phoneNumber || decodeJid(p.id)).split('@')[0] === botNumber)?.admin) {
                return kaya.sendMessage(from, { text: "❌ Need admin." }, { quoted: mek });
            }
        }

        if (typeof cmd.execute === "function") await cmd.execute(kaya, mek, from, args, prefix);
    } catch (err) { console.error(chalk.red("[ERROR case.js]:"), err); }
}

async function executeUtilities(kaya, mek, from, body, ownerId, groupId) {
    const utils = ["antibot", "antilink", "antitag", "antispam"];
    for (const name of utils) {
        // C'est ici que votre ancien code différait : il vérifiait souvent 
        // les réglages sur le 'from' (le groupe) directement.
        if (getSetting(ownerId, name, false, groupId)) {
            const util = commands.get(name);
            if (util && util.detect) {
                try {
                    await util.detect(kaya, mek, from, body);
                } catch (e) { console.error(`❌ Error in ${name}:`, e); }
            }
        }
    }
}
