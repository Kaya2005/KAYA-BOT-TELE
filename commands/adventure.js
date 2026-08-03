import db from '#db';
import { getSetting } from '../setting.js';

export default {
  name: 'adventure',
  category: 'economy',
  description: 'Go on adventures to earn coins.',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const chat = db.getChat(from);
      if (chat.adminonly || !chat.economy) {
        return await kaya.sendMessage(from, { 
          text: `ꕥ *Economy* commands are disabled in this group.\n\nAn *administrator* can enable them with the command:\n» *${prefix}economy on*` 
        }, { quoted: mek });
      }

      const botId = kaya.user.id.split(':')[0];
      const currency = getSetting(botId, 'currency', 'coins');

      db.setCreate('chat_users', [from, mek.sender], 'weapons', {});
      db.setCreate('chat_users', [from, mek.sender], 'lastadventure', 0);    
      
      let user = db.getChatUser(from, mek.sender);
      if (user.weapons && typeof user.weapons === 'string') {
        try { user.weapons = JSON.parse(user.weapons); } catch { user.weapons = {}; }
      }

      const staminaConsumed = Math.floor(Math.random() * (5 - 1 + 1)) + 1;
      if (user.stamina < staminaConsumed) {
        return await kaya.sendMessage(from, { 
          text: `ꕥ You don't have enough stamina to go on an adventure.\n> Use *${prefix}heal* to heal yourself.` 
        }, { quoted: mek });
      }    

      let usingMagic = false;
      let usingWeapon = false;    

      if (user.weapons?.sword || user.weapons?.espada) {
        const weaponKey = user.weapons?.sword ? 'sword' : 'espada';
        if (user.weapons[weaponKey].durability <= 10) {
          delete user.weapons[weaponKey];
          db.setChatUser(from, mek.sender, 'weapons', user.weapons);
          return await kaya.sendMessage(from, { 
            text: `ꕥ Your sword has broken from use and has been removed from your inventory.\n> Buy a new one with: *${prefix}buy sword*` 
          }, { quoted: mek });
        }
        usingWeapon = true;
      } else {
        const magicConsumed = Math.floor(Math.random() * (12 - 1 + 1)) + 1;
        if (user.magic < magicConsumed) {
          return await kaya.sendMessage(from, { 
            text: `ꕥ Your magic is exhausted and you don't have a weapon.\n> Take a potion to replenish your magic or buy a weapon with: *${prefix}buy sword*` 
          }, { quoted: mek });
        }
        usingMagic = true;
        user.magic -= magicConsumed;
        db.setChatUser(from, mek.sender, 'magic', user.magic);
      }    

      if (user.health < 5) {
        return await kaya.sendMessage(from, { 
          text: `ꕥ You don't have enough health to go on an adventure again.\n> Use *${prefix}heal* to heal yourself.` 
        }, { quoted: mek });
      }    

      const remainingTime = user.lastadventure - Date.now();
      if (remainingTime > 0) {
        const body = mek.text || mek.message?.conversation || mek.message?.extendedTextMessage?.text || '';
        const command = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(' ')[0] : 'adventure';
        return await kaya.sendMessage(from, { 
          text: `ꕥ You must wait *${msToTime(remainingTime)}* to use *${prefix + command}* again.` 
        }, { quoted: mek });
      }    

      user.stamina -= staminaConsumed;
      db.setChatUser(from, mek.sender, 'stamina', user.stamina);    

      const rand = Math.random();
      let cantidad = 0;
      let salud = Math.floor(Math.random() * (20 - 1 + 1)) + 1;
      let durabilityConsumed = Math.floor(Math.random() * (15 - 1 + 1)) + 1;
      let message;    

      if (rand < 0.4) {
        if (usingWeapon) {
          const weaponKey = user.weapons?.sword ? 'sword' : 'espada';
          user.weapons[weaponKey].durability -= durabilityConsumed;
          if (user.weapons[weaponKey].durability <= 10) {
            delete user.weapons[weaponKey];
          }
          db.setChatUser(from, mek.sender, 'weapons', user.weapons);
        }
        cantidad = Math.floor(Math.random() * (18000 - 14000 + 1)) + 14000;
        user.coins += cantidad;
        user.health -= salud;
        db.setChatUser(from, mek.sender, 'coins', user.coins);
        db.setChatUser(from, mek.sender, 'health', user.health);      
        
        const successMessages = [
          `You defeated an ogre ambushed among the trees of Drakonia, winning *¥${cantidad.toLocaleString()} ${currency}*.`,
          `You became champion of the Valoria gladiators tournament, winning *¥${cantidad.toLocaleString()} ${currency}*.`,
          `You rescued a magic book from the altar of Whispers, winning *¥${cantidad.toLocaleString()} ${currency}*.`,
          `You freed villagers trapped in the mines of Ulderan after defeating the trolls, winning *¥${cantidad.toLocaleString()} ${currency}*.`,
          `You defeated a young dragon in the cliffs of Flamear, winning *¥${cantidad.toLocaleString()} ${currency}*.`,
          `You found a sacred reliquary in the ruins of Iskaria and protected it from looters, winning *¥${cantidad.toLocaleString()} ${currency}*.`,
          `You triumphed in the duel against the corrupt knight of Invalion, winning *¥${cantidad.toLocaleString()} ${currency}*.`,
          `You conquered the cursed fortress of the Red Shadows without casualties, winning *¥${cantidad.toLocaleString()} ${currency}*.`,
          `You infiltrated the temple of the Void and recovered the balance crystal, winning *¥${cantidad.toLocaleString()} ${currency}*.`,
          `You solved the riddle of the eternal crypt and obtained a legendary treasure, winning *¥${cantidad.toLocaleString()} ${currency}*.`
        ];
        message = pickRandom(successMessages);
      } else if (rand < 0.7) {
        if (usingWeapon) {
          const weaponKey = user.weapons?.sword ? 'sword' : 'espada';
          user.weapons[weaponKey].durability -= durabilityConsumed;
          if (user.weapons[weaponKey].durability <= 10) {
            delete user.weapons[weaponKey];
          }
          db.setChatUser(from, mek.sender, 'weapons', user.weapons);
        }
        cantidad = Math.floor(Math.random() * (11000 - 9000 + 1)) + 9000;
        const total = (user.coins || 0) + (user.bank || 0);
        if (total >= cantidad) {
          if (user.coins >= cantidad) {
            user.coins -= cantidad;
            db.setChatUser(from, mek.sender, 'coins', user.coins);
          } else {
            const restante = cantidad - user.coins;
            user.coins = 0;
            user.bank -= restante;
            db.setChatUser(from, mek.sender, 'coins', 0);
            db.setChatUser(from, mek.sender, 'bank', user.bank);
          }
        } else {
          cantidad = total;
          user.coins = 0;
          user.bank = 0;
          db.setChatUser(from, mek.sender, 'coins', 0);
          db.setChatUser(from, mek.sender, 'bank', 0);
        }
        user.health -= salud;
        if (user.health < 0) user.health = 0;
        db.setChatUser(from, mek.sender, 'health', user.health);      
        
        const failMessages = [
          `The dark sorcerer cast a curse on you and you fled, losing *¥${cantidad.toLocaleString()} ${currency}*.`,
          `You got lost in the jungle of Zarkelia and some bandits ambushed you, losing *¥${cantidad.toLocaleString()} ${currency}*.`,
          `A basilisk charged at you and you escaped wounded without loot, losing *¥${cantidad.toLocaleString()} ${currency}*.`,
          `Your incursion into the ice tower failed when you fell into a magical trap, losing *¥${cantidad.toLocaleString()} ${currency}*.`,
          `You lost your way among the portals of the mirror forest and ended up without a reward, losing *¥${cantidad.toLocaleString()} ${currency}*.`,
          `A group of trolls ambushed you and took your belongings, losing *¥${cantidad.toLocaleString()} ${currency}*.`,
          `The ancient dragon defeated you and forced you to flee, losing *¥${cantidad.toLocaleString()} ${currency}*.`
        ];
        message = pickRandom(failMessages);
      } else {
        const neutralMessages = [
          `You explore ancient ruins and learn hidden secrets.`,
          `You follow the trail of a specter but it disappears into the fog.`,
          `You accompany a princess through the deserts of Thaloria without setbacks.`,
          `You wander through an enchanted forest and discover new routes.`,
          `You visit a remote village and listen to tales of old battles.`
        ];
        message = pickRandom(neutralMessages);
      }    

      db.setChatUser(from, mek.sender, 'lastadventure', Date.now() + 20 * 60 * 1000);
      await kaya.sendMessage(from, { text: `「✿」 ${message}` }, { quoted: mek });

    } catch (err) {
      console.error('❌ Adventure error:', err);
      const body = mek.text || mek.message?.conversation || mek.message?.extendedTextMessage?.text || '';
      const command = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(' ')[0] : 'adventure';

      await kaya.sendMessage(from, { 
        text: `> An unexpected error occurred while executing command *${prefix + command}*.\n> [Error: *${err.message}*]` 
      }, { quoted: mek });
    }
  }
};

function msToTime(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const min = minutes < 10 ? '0' + minutes : minutes;
  const sec = seconds < 10 ? '0' + seconds : seconds;
  return min === '00' ? `${sec} second${sec > 1 ? 's' : ''}` : `${min} minute${min > 1 ? 's' : ''}, ${sec} second${sec > 1 ? 's' : ''}`;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
