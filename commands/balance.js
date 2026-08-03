import db from '#db';
import { getSetting } from '../setting.js';

export default {
  name: 'balance',
  category: 'economy',
  description: 'Check how many coins you have.',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const chatData = db.getChat(from);
      const botId = kaya.user.id.split(':')[0];
      const monedas = getSetting(botId, 'currency', 'coins');

      if (chatData.adminonly || !chatData.economy) {
        return await kaya.sendMessage(from, { 
          text: `ꕥ *Economy* commands are disabled in this group.\n\nAn *administrator* can enable them with the command:\n» *${prefix}economy on*` 
        }, { quoted: mek });
      }

      const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const quotedSender = mek.message?.extendedTextMessage?.contextInfo?.participant;
      const who = mentioned || quotedSender || mek.sender;

      const user = db.getChatUser(from, who);
      if (!user) {
        return await kaya.sendMessage(from, { 
          text: `「✎」 The mentioned user is not registered in the bot.` 
        }, { quoted: mek });
      }

      const users = db.getUser(who);
      const total = (user.coins || 0) + (user.bank || 0);

      const bal = `✿ User \`<${users?.name || who.split('@')[0]}>\`

⛀ Wallet › *¥${user.coins?.toLocaleString() || 0} ${monedas}*
⚿ Bank › *¥${user.bank?.toLocaleString() || 0} ${monedas}*
⛁ Total › *¥${total.toLocaleString()} ${monedas}*

> _To protect your money, deposit it in the bank using ${prefix}deposit!_`;

      await kaya.sendMessage(from, { text: bal }, { quoted: mek });

    } catch (err) {
      console.error('❌ Balance error:', err);
      await kaya.sendMessage(from, { 
        text: `> An unexpected error occurred while executing command *${prefix}balance*.\n> [Error: *${err.message}*]` 
      }, { quoted: mek });
    }
  }
};
