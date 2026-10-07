import checkAdminOrOwner from "../setting/checkAdminOrOwner.js";
import { getBotName } from '../setting/botAssets.js';

export default {
  name: "setgdesc",
  alias: ["gdesc", "setgroupdesc"],
  category: "Group",
  description: "Change the group description",
  group: true,
  admin: true,
  botAdmin: true,
  ownerOnly: false,
  usage: ".setgdesc <new description>",

  async execute(kaya, mek, from, args, prefix) {
    try {
      const sender = mek.sender;
      const botName = getBotName(sender);
      const newDesc = args.join(" ").trim();

      // 🔐 Check admin / owner
      const check = await checkAdminOrOwner(kaya, from, sender);
      if (!check.isGroupAdmin && !check.isOwner) {
        return await kaya.sendMessage(from, { text: "🚫 Admins or Owner only." }, { quoted: mek });
      }

      if (!newDesc) {
        return await kaya.sendMessage(from, { 
            text: `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰\n❌ *Usage*: \`${prefix}setgdesc <new description>\`` 
        }, { quoted: mek });
      }

      await kaya.groupUpdateDescription(from, newDesc);

      return await kaya.sendMessage(from, { 
          text: `✅ *Group description updated successfully!*` 
      }, { quoted: mek });

    } catch (err) {
      console.error("[SETGDESC] Error:", err);
      return await kaya.sendMessage(from, { text: "❌ Unable to change the group description." }, { quoted: mek });
    }
  }
};
