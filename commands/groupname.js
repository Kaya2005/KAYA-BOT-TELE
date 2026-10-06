export default {
  name: 'groupname',
  alias: ['setgroupname'],
  description: 'Change the group name',
  category: 'Group',
  group: true,
  admin: true,
  botAdmin: true,
  usage: 'groupname NewName',

  async execute(kaya, mek, from, args, prefix) {
    try {
      if (!args[0]) {
        return await kaya.sendMessage(
          from,
          {
            text: `❌ Usage: \`${prefix}groupname NewName\``
          },
          { quoted: mek }
        );
      }

      const newName = args.join(' ').trim();

      // ✏️ Change the group name
      await kaya.groupUpdateSubject(from, newName);

      return await kaya.sendMessage(
        from,
        {
          text: `✅ Group name changed to: *${newName}*`
        },
        { quoted: mek }
      );

    } catch (err) {
      console.error('❌ groupname error:', err);

      return await kaya.sendMessage(
        from,
        {
          text: '❌ Unable to change the group name. Make sure I am an admin.'
        },
        { quoted: mek }
      );
    }
  }
};
