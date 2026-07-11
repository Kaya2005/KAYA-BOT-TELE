//decodeJid.js
export default function decodeJid(jid) {
  if (!jid) return jid;

  // 1. Gérer le multi-device (retirer ce qu'il y a après le :)
  jid = jid.split(':')[0];

  // 2. Si le jid est un numéro seul (ex: 243...), on ajoute le suffixe
  if (!jid.includes('@')) {
    jid = jid + '@s.whatsapp.net';
  }

  // 3. Convertir @c.us (privé) en @s.whatsapp.net (standard)
  if (jid.endsWith('@c.us')) {
    jid = jid.replace('@c.us', '@s.whatsapp.net');
  }

  return jid.toLowerCase();
}
