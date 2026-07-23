import fs from 'fs';
import path from 'path';
import { getSetting, setSetting } from '../setting.js';

// ===================== BOT CORE =====================

export const BOT_VERSION = '1';
export const BOT_SLOGAN = '  `『 BY 𝐊𝐀𝐘𝐀²⁰²⁶』`';

const botImageFile = path.join(process.cwd(), 'setting', 'botImage.json');
const localFallbackImage = path.join(process.cwd(), 'setting', 'bot.jpg');

// Nom par défaut si rien n'est configuré
export const DEFAULT_BOT_NAME = '𝐊𝐀𝐘𝐀 𝐁𝐎𝐓';

// Image par défaut (Globale)
let globalBotImagePath = 'https://files.catbox.moe/1ddhgm.jpg';

const settingDir = path.join(process.cwd(), 'setting');
if (!fs.existsSync(settingDir)) {
    fs.mkdirSync(settingDir, { recursive: true });
}

// Chargement de l'image globale depuis le fichier
if (fs.existsSync(botImageFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(botImageFile, 'utf-8'));
    if (data?.url) globalBotImagePath = data.url;
  } catch (e) {
    console.error('❌ Failed to load global bot image:', e);
  }
}

// ===================== HELPERS =====================

/**
 * Retourne le nom configuré pour l'utilisateur (jid)
 */
export function getBotName(jid) {
  const senderId = jid.split('@')[0];
  return getSetting(senderId, 'botName', DEFAULT_BOT_NAME);
}

// Définit l'image globale par défaut
export function setBotImage(value) {
  globalBotImagePath = value;
  fs.writeFileSync(botImageFile, JSON.stringify({ url: value }, null, 2));
}

// Définit l'image pour un utilisateur spécifique
export function setBotImageForUser(senderId, url) {
  setSetting(senderId, 'userBotImage', url);
}

// ===================== PAYLOAD =====================

export function getBotImagePayload(senderJid) {
  const senderId = senderJid.split('@')[0];
  
  // 1. Priorité à l'image personnalisée de l'utilisateur
  const userImage = getSetting(senderId, 'userBotImage', null);
  const targetImage = userImage || globalBotImagePath;

  if (targetImage && targetImage.startsWith('http')) {
    return { type: 'url', value: targetImage };
  }
  
  // 2. Fallback local si l'URL est invalide ou manquante
  if (fs.existsSync(localFallbackImage)) {
    return { type: 'buffer', value: fs.readFileSync(localFallbackImage) };
  }
  return null;
}

// ===================== UNIVERSAL IMAGE SENDER =====================

export async function sendWithBotImage(kaya, chat, senderJid, content = {}, options = {}) {
  const payload = getBotImagePayload(senderJid);

  if (payload?.type === 'url') {
    try {
      await kaya.sendMessage(chat, { image: { url: payload.value }, ...content }, options);
      return; 
    } catch (err) {
      console.warn('⚠️ Image URL failed, trying local fallback');
    }
  }

  try {
    if (!fs.existsSync(localFallbackImage)) throw new Error('Local fallback missing');
    const buffer = fs.readFileSync(localFallbackImage);
    await kaya.sendMessage(chat, { image: buffer, ...content }, options);
    return;
  } catch (err) {
    console.warn('⚠️ Local image failed, sending text only');
  }

  if (content.caption) {
    await kaya.sendMessage(chat, { text: content.caption }, options);
  } else {
    await kaya.sendMessage(chat, content, options);
  }
}

// ===================== CONNECTION MESSAGE =====================

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
}
