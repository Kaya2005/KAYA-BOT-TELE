import checkAdminOrOwner from '../setting/checkAdminOrOwner.js';
import { getBotName } from '../setting/botAssets.js';

export default {
  name: 'del',
  alias: ['delete', 'rm'],
  description: 'Delete messages',
  category: 'Group',
  group: true,
  admin: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      
      // 🔐 Vérification Admin/Owner
      const check = await checkAdminOrOwner(kaya, from, sender);
      if (!check.isGroupAdmin && !check.isOwner) {
        return await kaya.sendMessage(from, { text: '🚫 Admins or Owner only.' }, { quoted: mek });
      }

      // ===== CAS REPLY =====
      const quoted = mek.message?.extendedTextMessage?.contextInfo;
      if (quoted?.stanzaId) {
        return await kaya.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: quoted.stanzaId,
            participant: quoted.participant
          }
        }).catch(console.error);
      }

      // ===== CAS SIMPLE (Suppression du message de commande) =====
      await kaya.sendMessage(from, { delete: mek.key }).catch(() => {});

    } catch (err) {
      console.error('[DEL ERROR]', err);
      await kaya.sendMessage(from, { text: '❌ An error occurred while deleting the message.' }, { quoted: mek });
    }
  }
};
