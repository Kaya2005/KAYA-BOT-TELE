import checkAdminOrOwner from '../setting/checkAdminOrOwner.js'; // Chemin corrigé

export default {
  name: 'unmute',
  alias: ['unlock', 'deverrouiller'],
  description: '🔓 Unlock the group silently',
  category: 'Groupe',
  group: true,
  admin: true,
  botAdmin: true,

  execute: async (kaya, mek, from, args, prefix) => {
    try {
      const permissions = await checkAdminOrOwner(kaya, from, mek.sender);
      
      if (!permissions.isAdminOrOwner) return;

      // 🔓 Unlock group
      await kaya.groupSettingUpdate(from, 'not_announcement');

    } catch (err) {
      console.error('❌ unmute.js error:', err);
      await kaya.sendMessage(
        from,
        { text: '❌ Failed to unlock the group. Make sure I am admin.' },
        { quoted: mek }
      );
    }
  }
};
