import checkAdminOrOwner from '../setting/checkAdminOrOwner.js'; // Chemin corrigé

export default {
  name: 'mute',
  alias: ['lock', 'verrouiller'],
  description: '🔒 Lock the group silently',
  category: 'Group',
  group: true,
  admin: true,
  botAdmin: true,

  execute: async (kaya, mek, from, args, prefix) => {
    try {
      const permissions = await checkAdminOrOwner(kaya, from, mek.sender);
      
      if (!permissions.isAdminOrOwner) return;

      // 🔒 Lock group
      await kaya.groupSettingUpdate(from, 'announcement');

    } catch (err) {
      console.error('❌ mute.js error:', err);
      await kaya.sendMessage(
        from,
        { text: '❌ Failed to lock the group. Make sure I am admin.' },
        { quoted: mek }
      );
    }
  }
};
