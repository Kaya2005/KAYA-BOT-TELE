//checkAdminOrOwner.js
import decodeJid from './decodeJid.js';
import config from '../config.js';

export default async function checkAdminOrOwner(sock, chatId, sender) {
  const isGroup = chatId.endsWith('@g.us');

  // 🔹 Normalisation
  const senderJid = decodeJid(sender);
  const senderNumber = senderJid.split('@')[0];
  const botNumber = decodeJid(sock.user.id).split('@')[0];

  // 🔹 Owners globaux (le dev) + Propriétaire de la session (le client)
  const ownerNumbers = (config.OWNERS || []).map(n => n.toString().replace(/\D/g, ''));
  
  const isBotOwner = ownerNumbers.includes(senderNumber) || (senderNumber === botNumber);

  if (!isGroup) {
    return {
      isAdmin: false,
      isGroupOwner: false,
      isBotOwner: isBotOwner,
      isOwner: isBotOwner,
      isAdminOrOwner: isBotOwner, // Autorise le propriétaire hors groupe
      participant: null
    };
  }

  let metadata;
  try {
    metadata = await sock.groupMetadata(chatId);
  } catch (e) {
    return {
      isAdmin: false,
      isGroupOwner: false,
      isBotOwner: isBotOwner,
      isOwner: isBotOwner,
      isAdminOrOwner: isBotOwner,
      participant: null
    };
  }

  const participant = metadata.participants.find(p => decodeJid(p.id) === senderJid);
  
  const isAdmin = (participant?.admin === 'admin' || participant?.admin === 'superadmin') || isBotOwner;
  const isGroupOwner = metadata.owner && decodeJid(metadata.owner) === senderJid;

  return {
    isAdmin,
    isGroupOwner,
    isBotOwner,
    isOwner: isBotOwner,
    isAdminOrOwner: isAdmin || isBotOwner, 
    participant
  };
}
