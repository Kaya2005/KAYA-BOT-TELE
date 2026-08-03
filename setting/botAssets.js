import fs from 'fs';
import path from 'path';
import { getSetting, setSetting } from '../setting.js';

// ===================== BOT CORE =====================

export const BOT_VERSION = '1';
export const BOT_SLOGAN = '  `『 BY 𝐊𝐀𝐘𝐀²⁰²⁶』`';

const globalBotImageFile = path.join(process.cwd(), 'setting', 'botImage.json');
const defaultGlobalImage = 'https://files.catbox.moe/cctme5.jpg';

// Nom par défaut si rien n'est configuré
export const DEFAULT_BOT_NAME = 'ƘƛƳƛ ƁƠƬ';

const settingDir = path.join(process.cwd(), 'setting');
if (!fs.existsSync(settingDir)) {
    fs.mkdirSync(settingDir, { recursive: true });
}

/**
 * Retourne le chemin de l'image locale propre à l'utilisateur (ownerId)
 */
export function getLocalBotImagePath(ownerId) {
    const cleanOwnerId = (ownerId || '').replace(/[^0-9]/g, '');
    if (!cleanOwnerId) return path.join(process.cwd(), 'setting', 'bot.jpg');
    
    const userDir = path.join('/home/container/Kaya-MD', 'userall', cleanOwnerId);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }
    return path.join(userDir, 'bot.jpg');
}

/**
 * Retourne le nom configuré pour l'utilisateur
 */
export function getBotName(ownerId) {
  const cleanId = ownerId.replace(/[^0-9]/g, '');
  return getSetting(cleanId, 'botName', DEFAULT_BOT_NAME);
}

// ===================== PAYLOAD =====================

export function getBotImagePayload(ownerId) {
  const cleanOwnerId = (ownerId || '').replace(/[^0-9]/g, '');
  const localImage = getLocalBotImagePath(cleanOwnerId);
  
  // 1. 🔄 PRIORITÉ À L'IMAGE LOCALE DE L'UTILISATEUR
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
  const cleanOwnerId = (ownerId || '').replace(/[^0-9]/g, '');
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
