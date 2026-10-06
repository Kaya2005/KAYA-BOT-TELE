import { getSetting, setSetting } from "../setting.js";
import chalk from "chalk";

const messageStore = new Map();
const MAX_STORE_SIZE = 1000;
const MESSAGE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Nettoyage automatique en arrière-plan toutes les 10 minutes
 */
setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [id, data] of messageStore.entries()) {
        if (now - data.timestamp > MESSAGE_TTL) {
            messageStore.delete(id);
            cleanedCount++;
        }
    }
    if (cleanedCount > 0) {
        console.log(chalk.gray(`[ANTI-DELETE] Nettoyage automatique : ${cleanedCount} vieux messages purgés.`));
    }
}, 10 * 60 * 1000);

/**
 * Enregistre le message SEULEMENT si l'anti-delete est activé par le propriétaire
 */
export function storeMessage(kaya, mek) {
    if (!mek || !mek.message || !mek.key || !mek.key.id || mek.key.id.startsWith("BAE5")) return;

    const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
    if (!ownerId) return;

    const from = mek.key.remoteJid;
    if (!from) return;
    const isGroup = from.endsWith("@g.us");

    // 🔍 Vérification des réglages AVANT d'allouer de la mémoire
    const antideleteAll = getSetting(ownerId, 'antidelete_all', false);
    const antideleteGroup = getSetting(ownerId, 'antidelete_group', false);
    const antideletePrivate = getSetting(ownerId, 'antidelete_private', false);

    const isActive = antideleteAll || (isGroup && antideleteGroup) || (!isGroup && antideletePrivate);
    if (!isActive) return; // Stoppe net si l'anti-delete n'est pas activé !

    if (messageStore.size >= MAX_STORE_SIZE) {
        const firstKey = messageStore.keys().next().value;
        messageStore.delete(firstKey);
    }

    messageStore.set(mek.key.id, {
        mek: mek,
        timestamp: Date.now()
    });
}

/**
 * Gère la détection et le renvoi des messages supprimés
 */
export async function handleAntiDelete(kaya, updates) {
    for (const update of updates) {
        if (
            update.update?.message?.protocolMessage?.type === 0 || 
            update.update?.message?.protocolMessage?.type === "REVOKE" ||
            update.update?.messageStubType === 68
        ) {
            const deletedKey = update.update.message?.protocolMessage?.key || update.key;
            if (!deletedKey || !deletedKey.id) continue;

            const storedData = messageStore.get(deletedKey.id);
            if (!storedData) continue;

            if (Date.now() - storedData.timestamp > MESSAGE_TTL) {
                messageStore.delete(deletedKey.id);
                continue;
            }

            const originalMessage = storedData.mek;
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
            if (!ownerId) continue;

            const from = originalMessage.key.remoteJid;
            const isGroup = from.endsWith("@g.us");

            const antideleteAll = getSetting(ownerId, 'antidelete_all', false);
            const antideleteGroup = getSetting(ownerId, 'antidelete_group', false);
            const antideletePrivate = getSetting(ownerId, 'antidelete_private', false);

            const isActive = antideleteAll || (isGroup && antideleteGroup) || (!isGroup && antideletePrivate);
            if (!isActive) continue;

            const sender = originalMessage.key.participant || originalMessage.sender || from;
            const ownerJid = `${ownerId}@s.whatsapp.net`;

            try {
                let chatName = isGroup ? "un groupe" : "une conversation privée";
                if (isGroup) {
                    try {
                        const metadata = await kaya.groupMetadata(from).catch(() => null);
                        if (metadata) chatName = `le groupe *${metadata.subject}*`;
                    } catch {}
                }

                const notificationText = `🛡️ *ANTI-DELETE DÉTECTÉ*\n\n` +
                    `👤 *Auteur:* @${sender.split('@')[0]}\n` +
                    `📍 *Lieu:* ${chatName}\n` +
                    `🕒 *Heure:* ${new Date().toLocaleTimeString()}\n\n` +
                    `*Message supprimé ci-dessous :*`;

                await kaya.sendMessage(ownerJid, { text: notificationText, mentions: [sender] });
                await kaya.sendMessage(ownerJid, { forward: originalMessage });

                console.log(chalk.green(`[ANTI-DELETE] Message supprimé renvoyé à l'owner (${ownerJid})`));
            } catch (err) {
                console.error(chalk.red("[ERREUR ANTI-DELETE]:"), err);
            }
        }
    }
}

export default {
    name: "antidelete",
    alias: ["adel"],
    ownerOnly: true,
    description: "Active ou désactive l'anti-suppression (all, group, private)",
    async execute(kaya, mek, from, args, prefix) {
        const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
        const subCmd = args[0]?.toLowerCase();
        const action = args[1]?.toLowerCase();

        if (!subCmd || !["all", "group", "private"].includes(subCmd)) {
            const all = getSetting(ownerId, 'antidelete_all', false);
            const group = getSetting(ownerId, 'antidelete_group', false);
            const priv = getSetting(ownerId, 'antidelete_private', false);

            const text = `🛡️ *STATUT ANTI-DELETE*\n\n` +
                `• *All* : ${all ? "✅ Activé" : "❌ Désactivé"}\n` +
                `• *Group* : ${group ? "✅ Activé" : "❌ Désactivé"}\n` +
                `• *Private* : ${priv ? "✅ Activé" : "❌ Désactivé"}\n\n` +
                `*Utilisation :*\n` +
                `• ${prefix}antidelete all on/off\n` +
                `• ${prefix}antidelete group on/off\n` +
                `• ${prefix}antidelete private on/off`;

            return await kaya.sendMessage(from, { text }, { quoted: mek });
        }

        if (!action || !["on", "off", "true", "false", "1", "0"].includes(action)) {
            return await kaya.sendMessage(from, { text: `❌ Précisez 'on' ou 'off'. Exemple : *${prefix}antidelete ${subCmd} on*` }, { quoted: mek });
        }

        const isOn = ["on", "true", "1"].includes(action);
        const settingKey = `antidelete_${subCmd}`;

        await setSetting(ownerId, settingKey, isOn);

        await kaya.sendMessage(from, { text: `✅ Anti-delete *${subCmd}* ${isOn ? "activé" : "désactivé"} avec succès !` }, { quoted: mek });
    }
};
