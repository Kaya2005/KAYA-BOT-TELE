import fs from 'fs';
import path from 'path';
import { getSetting } from '../setting.js';

// ===================== BOT CORE =====================

export const BOT_VERSION = '1';
export const BOT_SLOGAN = ' `『by ƘƛƳƛ ƁƠƬ』` ';

const defaultGlobalImage = 'https://files.catbox.moe/lo0p98.png';
export const DEFAULT_BOT_NAME = 'ƘƛƳƛ ƁƠƬ';

const settingDir = path.join(process.cwd(), 'setting');
if (!fs.existsSync(settingDir)) {
    fs.mkdirSync(settingDir, { recursive: true });
}

/**
 * 🧼 Nettoie et extrait l'ID unique de l'utilisateur
 */
function cleanId(ownerId) {
    if (!ownerId) return '';
    return String(ownerId).split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
}

/**
 * Retourne le chemin de l'image locale propre à l'utilisateur
 */
export function getLocalBotImagePath(ownerId) {
    const cleanOwnerId = cleanId(ownerId);
    if (!cleanOwnerId) return path.join(process.cwd(), 'setting', 'bot.jpg');
    
    const userDir = path.join('/home/container/Kaya-MD', 'userall', cleanOwnerId);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }
    return path.join(userDir, 'bot.jpg');
}

/**
 * Retourne le nom configuré pour l'utilisateur spécifique
 */
export function getBotName(ownerId) {
    const cleanOwnerId = cleanId(ownerId);
    if (!cleanOwnerId) return DEFAULT_BOT_NAME;
    
    // Récupère le nom personnalisé, ou la valeur par défaut si non configuré
    return getSetting(cleanOwnerId, 'botName', DEFAULT_BOT_NAME);
}

// ===================== PAYLOAD =====================

export function getBotImagePayload(ownerId) {
    const cleanOwnerId = cleanId(ownerId);
    
    if (cleanOwnerId) {
        const localImage = getLocalBotImagePath(cleanOwnerId);
        
        // 1. 🔄 PRIORITÉ À L'IMAGE LOCALE DE CET UTILISATEUR
        if (fs.existsSync(localImage)) {
            return { type: 'buffer', value: fs.readFileSync(localImage) };
        }

        // 2. Image personnalisée par URL dans ses settings
        const userImageUrl = getSetting(cleanOwnerId, 'userBotImage', null);
        if (userImageUrl && userImageUrl.startsWith('http')) {
            return { type: 'url', value: userImageUrl };
        }
    }
    
    // 3. Fallback global par défaut si l'utilisateur n'a rien configuré
    return { type: 'url', value: defaultGlobalImage };
}

// ===================== UNIVERSAL IMAGE SENDER =====================

export async function sendWithBotImage(kaya, chat, ownerId, content = {}, options = {}) {
    const cleanOwnerId = cleanId(ownerId);
    const payload = getBotImagePayload(cleanOwnerId);

    if (payload?.type === 'buffer') {
        try {
            await kaya.sendMessage(chat, { image: payload.value, ...content }, options);
            return;
        } catch (err) {
            console.warn('⚠️ Échec de l\'image locale, tentative avec l\'URL fallback');
        }
    }

    if (payload?.type === 'url') {
        try {
            await kaya.sendMessage(chat, { image: { url: payload.value }, ...content }, options);
            return; 
        } catch (err) {
            console.warn('⚠️ Échec de l\'URL d\'image, envoi en texte seul');
        }
    }

    if (content.caption) {
        await kaya.sendMessage(chat, { text: content.caption }, options);
    } else {
        await kaya.sendMessage(chat, content, options);
    }
}

// ===================== MESSAGES (CONNECTION & UPDATE) =====================

export function connectionMessage(botName = DEFAULT_BOT_NAME) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('en-GB');

    return `
▉ \`${botName}\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*⏱️ : ${time} • GMT*
*📅 : ${date}*
*🟢 STATUS : CONNECTED*
*🧪 VERSION : v${BOT_VERSION}*
______________________
➠https://t.me/kayatech2
`.trim();
}

export function updateMessage(updateData, botName = DEFAULT_BOT_NAME) {
    return `
 \`${botName} UPDATED\` 
▰▰▰▰▰▰▰▰▰▰▰▰▰
*📌 Commit :* \`${updateData.commitHash}\`
*💬 Message :* _${updateData.commitMsg}_

*📂 Fichiers modifiés (${updateData.changed?.length || 0}) :*
${updateData.changed && updateData.changed.length ? updateData.changed.slice(0, 6).join('\n') : '• Fichiers système mis à jour'}

*🟢 STATUS : RUNNING LATEST VERSION*
______________________
➠https://t.me/kayatech2
`.trim();
}
