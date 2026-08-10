import fs from 'fs';
import path from 'path';
import { getSetting, setSetting } from '../setting.js';

// ===================== BOT CORE =====================

export const BOT_VERSION = '1';
export const BOT_SLOGAN = '  `『 BY 𝐊𝐀𝐘𝐀²⁰²⁶』`';

const defaultGlobalImage = 'https://files.catbox.moe/lo0p98.png';
export const DEFAULT_BOT_NAME = 'ƘƛƳƛ ƁƠƬ';

const settingDir = path.join(process.cwd(), 'setting');
if (!fs.existsSync(settingDir)) {
    fs.mkdirSync(settingDir, { recursive: true });
}

/**
 * 🔍 Détecte automatiquement l'ID du véritable propriétaire 
 * en lisant le dossier unique présent dans "userall/".
 */
function getActualOwnerId() {
    try {
        const userallDir = path.join('/home/container/Kaya-MD', 'userall');
        if (fs.existsSync(userallDir)) {
            const entries = fs.readdirSync(userallDir, { withFileTypes: true });
            const ownerDirs = entries.filter(e => e.isDirectory());
            if (ownerDirs.length > 0) {
                return ownerDirs[0].name; // Retourne l'ID du dossier owner
            }
        }
    } catch (e) {
        console.error('[BOT ASSETS] Erreur lors de la détection de l\'owner :', e);
    }
    return '';
}

/**
 * Retourne le chemin de l'image locale propre à l'owner (forcé automatiquement)
 */
export function getLocalBotImagePath(ownerId) {
    const cleanOwnerId = getActualOwnerId() || (ownerId || '').replace(/[^0-9]/g, '');
    if (!cleanOwnerId) return path.join(process.cwd(), 'setting', 'bot.jpg');
    
    const userDir = path.join('/home/container/Kaya-MD', 'userall', cleanOwnerId);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }
    return path.join(userDir, 'bot.jpg');
}

/**
 * Retourne le nom configuré pour le bot (forcé automatiquement sur le vrai owner)
 */
export function getBotName(ownerId) {
  const cleanId = getActualOwnerId() || (ownerId || '').replace(/[^0-9]/g, '');
  return getSetting(cleanId, 'botName', DEFAULT_BOT_NAME);
}

// ===================== PAYLOAD =====================

export function getBotImagePayload(ownerId) {
  const cleanOwnerId = getActualOwnerId() || (ownerId || '').replace(/[^0-9]/g, '');
  const localImage = getLocalBotImagePath(cleanOwnerId);
  
  // 1. 🔄 PRIORITÉ À L'IMAGE LOCALE DE L'OWNER
  if (fs.existsSync(localImage)) {
    return { type: 'buffer', value: fs.readFileSync(localImage) };
  }

  // 2. Image personnalisée par URL dans ses settings
  const userImageUrl = getSetting(cleanOwnerId, 'userBotImage', null);
  if (userImageUrl && userImageUrl.startsWith('http')) {
    return { type: 'url', value: userImageUrl };
  }
  
  // 3. Fallback global par défaut
  return { type: 'url', value: defaultGlobalImage };
}

// ===================== UNIVERSAL IMAGE SENDER =====================

export async function sendWithBotImage(kaya, chat, ownerId, content = {}, options = {}) {
  const cleanOwnerId = getActualOwnerId() || (ownerId || '').replace(/[^0-9]/g, '');
  const payload = getBotImagePayload(cleanOwnerId);

  if (payload?.type === 'buffer') {
    try {
      await kaya.sendMessage(chat, { image: payload.value, ...content }, options);
      return;
    } catch (err) {
      console.warn('⚠️ Local user image buffer failed, trying URL fallback');
    }
  }

  if (payload?.type === 'url') {
    try {
      await kaya.sendMessage(chat, { image: { url: payload.value }, ...content }, options);
      return; 
    } catch (err) {
      console.warn('⚠️ Image URL failed, sending text only');
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
