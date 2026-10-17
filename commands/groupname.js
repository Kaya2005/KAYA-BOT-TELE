// groupname.js
import { usageBox, successBox, errorBox } from '../setting/theme.js';
import { getString } from '../setting/language.js';

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
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

      if (!args[0]) {
        return await kaya.sendMessage(
          from,
          {
            text: usageBox(prefix, 'groupname', getString(ownerId, 'groupNameUsagePlaceholder'))
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
          text: successBox(`${getString(ownerId, 'groupNameSuccess')} : *${newName}*`)
        },
        { quoted: mek }
      );

    } catch (err) {
      console.error('❌ groupname error:', err);
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

      return await kaya.sendMessage(
        from,
        {
          text: errorBox(getString(ownerId, 'groupNameError'))
        },
        { quoted: mek }
      );
    }
  }
};
