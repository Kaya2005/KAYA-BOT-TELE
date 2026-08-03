import { delay } from 'baileys';
import db from '#db';
import { getSetting } from '../setting.js';
import { getBotName } from '../setting/botAssets.js';

let buatall = 1;
export default {
  name: 'casino',
  aliases: ['bet'],
  category: 'economy',
  description: 'Bet coins in the casino.',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const chatData = db.getChat(from);
      if (chatData.adminonly || !chatData.economy) {
        return await kaya.sendMessage(from, { 
          text: `ꕥ *Economy* commands are disabled in this group.\n\nAn *administrator* can enable them with the command:\n» *${prefix}economy on*` 
        }, { quoted: mek });
      }        

      const botId = kaya.user.id.split(':')[0];
      const currency = getSetting(botId, 'currency', 'coins');
      const botName = getBotName(mek.sender);    

      db.setCreate('chat_users', [from, mek.sender], 'lastApuesta', 0);
      const user = db.getChatUser(from, mek.sender);    
      let Aku = Math.floor(Math.random() * 101);
      let Kamu = Math.floor(Math.random() * 55);
      let count = args[0];
      const users = db.getUser(mek.sender);
      const userName = users?.name || mek.sender.split('@')[0];
      const tiempoEspera = 30 * 1000;
      const ahora = Date.now();        

      if (user.lastApuesta && ahora - user.lastApuesta < tiempoEspera) {
        const restante = user.lastApuesta + tiempoEspera - ahora;
        const tiempoRestante = formatTime(restante);
        return await kaya.sendMessage(from, { text: `ꕥ You must wait *${tiempoRestante}* to use *${prefix}casino* again.` }, { quoted: mek });
      }        

      db.setChatUser(from, mek.sender, 'lastApuesta', ahora);
      if (count && /all/i.test(count)) {
        count = Math.floor(users.limit / buatall);
      } else if (args[0]) {
        count = parseInt(args[0]);
      } else {
        count = 1;
      }        

      count = Math.max(1, count);
      if (args.length < 1) {
        return await kaya.sendMessage(from, { text: `❀ Enter the amount of *${currency}* you want to bet against *${botName}*\n> Example: *${prefix}casino 100*` }, { quoted: mek });
      }

      if (user.coins >= count) {
        db.setChatUser(from, mek.sender, 'coins', user.coins - count);
        let resultado = '';
        let ganancia = 0;

        if (Aku > Kamu) {
          resultado = `> ${userName}, *You lost ¥${formatNumber(count)} ${currency}*.`;
        } else if (Aku < Kamu) {
          ganancia = count * 2;
          db.setChatUser(from, mek.sender, 'coins', (user.coins - count) + ganancia);
          resultado = `> ${userName}, *You won ¥${formatNumber(ganancia)} ${currency}*.`;
        } else {
          ganancia = count;
          db.setChatUser(from, mek.sender, 'coins', (user.coins - count) + ganancia);
          resultado = `> ${userName}, *You won ¥${formatNumber(ganancia)} ${currency}*.`;
        }

        let { key } = await kaya.sendMessage(from, { text: "🎲 The croupier rolls the dice... Bets are closed!" }, { quoted: mek });
        await delay(2000);
        await kaya.sendMessage(from, { text: "❀ The numbers are spinning... Get ready for the result!", edit: key });
        await delay(2000);
        const replyMsg = `❀ \`Let's see what numbers you got!\`\n\n➠ *${botName}* : ${Aku}\n➠ *${userName}* : ${Kamu}\n\n${resultado}`;
        await kaya.sendMessage(from, { text: replyMsg.trim(), edit: key });

      } else {
        await kaya.sendMessage(from, { text: `ꕥ You don't have *¥${formatNumber(count)} ${currency}* to bet!` }, { quoted: mek });
      }

    } catch (err) {
      console.error('❌ casino.js error:', err);
      await kaya.sendMessage(from, { text: '❌ An error occurred.' }, { quoted: mek });
    }
  }
};

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatTime(ms) {
  if (ms <= 0 || isNaN(ms)) return 'Now';
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const partes = [];
  if (min) partes.push(`${min} minute${min !== 1 ? 's' : ''}`);
  partes.push(`${sec} second${sec !== 1 ? 's' : ''}`);
  return partes.join(' ');
}
