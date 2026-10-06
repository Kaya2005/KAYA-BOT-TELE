import fs from 'fs';
import path from 'path';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';

// Ajout du délai pour éviter la saturation
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadMediaMessage(message, mediaType) {
  const stream = await downloadContentFromMessage(message, mediaType);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  const tempDir = path.join(path.resolve(), 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const filePath = path.join(tempDir, `${Date.now()}.${mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'bin'}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export default {
  name: 'tag',
  alias: ['hidetag', 'everyone', 'all'],
  description: 'Mention all group members with text or quoted media',
  category: 'Group',
  
  group: true,
  admin: true,
  botAdmin: false,

  run: async (kaya, m, args) => {
    try {
      const from = m.key.remoteJid;
      const perms = await checkAdminOrOwner(kaya, from, m.sender);
      if (!perms.isAdminOrOwner) {
        return kaya.sendMessage(from, { text: '⛔ Only admins or owner can use this command.' }, { quoted: m });
      }

      const groupMetadata = await kaya.groupMetadata(from);
      const mentionedJidList = groupMetadata.participants.map(p => p.id);
      
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      let messageContent = {};
      let tempFile = null;

      // Gestion des médias avec téléchargement
      if (quoted) {
        const type = Object.keys(quoted)[0];
        if (['imageMessage', 'videoMessage', 'documentMessage'].includes(type)) {
            const mediaType = type.replace('Message', '');
            tempFile = await downloadMediaMessage(quoted[type], mediaType);
            messageContent = {
                [mediaType]: { url: tempFile },
                caption: args.join(' ') || quoted[type].caption || '📢 Attention everyone!',
                mentions: mentionedJidList
            };
        } else {
            messageContent = {
                text: args.join(' ') || quoted.conversation || quoted.extendedTextMessage?.text || '📢 Attention everyone!',
                mentions: mentionedJidList
            };
        }
      } else {
        messageContent = {
          text: args.join(' ') || '📢 Attention everyone!',
          mentions: mentionedJidList
        };
      }

      // SÉCURITÉ : Petit délai avant l'envoi pour éviter le mode "Machine Gun"
      await delay(1000);
      await kaya.sendMessage(from, messageContent, { quoted: m });

      // SÉCURITÉ : Suppression du fichier temporaire après envoi pour ne pas saturer votre disque
      if (tempFile && fs.existsSync(tempFile)) {
        await delay(2000);
        fs.unlinkSync(tempFile);
      }

    } catch (err) {
      console.error('❌ Tag command error:', err);
      await kaya.sendMessage(m.key.remoteJid, { text: '❌ Error occurred while sending the tag.' }, { quoted: m });
    }
  }
};
