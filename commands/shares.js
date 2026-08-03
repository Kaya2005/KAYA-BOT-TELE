import fetch from 'node-fetch';
import db from '#db';

const symbols = ['(⁠◠⁠‿⁠◕⁠)', '˃͈◡˂͈', '૮(˶ᵔᵕᵔ˶)ა', '(づ｡◕‿‿◕｡)づ', '(✿◡‿◡)', '(꒪⌓꒪)', '(✿✪‿✪｡)', '(*≧ω≦)', '(✧ω◕)', '˃ 𖥦 ˂', '(⌒‿⌒)', '(¬‿¬)', '(✧ω✧)', '✿(◕ ‿◕)✿', 'ʕ•́ᴥ•̀ʔっ', '(ㅇㅅㅇ❀)', '(∩︵∩)', '(✪ω✪)', '(✯◕‿◕✯)', '(•̀ᴗ•́)و ̑̑'];
function getRandomSymbol() { return symbols[Math.floor(Math.random() * symbols.length)]; }

const captions = {
  peek: (from, to) => from === to ? 'is peeking behind a door for fun.' : 'is peeking at',
  comfort: (from, to) => from === to ? 'is comforting themselves.' : 'is comforting',
  thinkhard: (from, to) => from === to ? 'is thinking very intensely.' : 'is thinking deeply about',
  curious: (from, to) => from === to ? 'is curious about everything.' : 'is curious about what',
  sniff: (from, to) => from === to ? 'is sniffing around like looking for something strange.' : 'is sniffing',
  stare: (from, to) => from === to ? 'is staring at the ceiling for no reason.' : 'is staring fixedly at',
  trip: (from, to) => from === to ? 'tripped over themselves, again.' : 'accidentally tripped over',
  blowkiss: (from, to) => from === to ? 'blows a kiss to the mirror.' : 'blew a kiss to',
  snuggle: (from, to) => from === to ? 'is snuggling with a soft pillow.' : 'is sweetly snuggling with',
  sleep: (from, to) => from === to ? 'is sleeping peacefully.' : 'is sleeping with',
  cold: (from, to) => from === to ? 'is very cold.' : 'is freezing because of',
  sing: (from, to) => from === to ? 'is singing.' : 'is singing to',
  tickle: (from, to) => from === to ? 'is tickling themselves.' : 'is tickling',
  scream: (from, to) => from === to ? 'is screaming at the wind.' : 'is screaming at',
  push: (from, to) => from === to ? 'pushed themselves.' : 'pushed',
  nope: (from, to) => from === to ? 'clearly expresses their disagreement.' : 'says "No!" to',
  jump: (from, to) => from === to ? 'jumps with joy.' : 'jumps happily with',
  heat: (from, to) => from === to ? 'feels very hot.' : 'is hot because of',
  gaming: (from, to) => from === to ? 'is playing alone.' : 'is playing with',
  draw: (from, to) => from === to ? 'makes a cute drawing.' : 'draws inspired by',
  call: (from, to) => from === to ? 'dials their own number waiting for an answer.' : 'called the number of',
  seduce: (from, to) => from === to ? 'threw a seductive look into the void.' : 'is trying to seduce',
  shy: (from, to, genero) => from === to ? 'blushed shyly and looked away.' : `feels too shy to look at`,
  slap: (from, to, genero) => from === to ? `slapped themselves.` : 'gave a slap to',
  bath: (from, to) => from === to ? 'is taking a bath.' : 'is bathing',
  angry: (from, to, genero) => from === to ? `is very angry.` : `is super angry with`,
  bored: (from, to, genero) => from === to ? `is very bored.` : `is bored of`,
  bite: (from, to, genero) => from === to ? `bit themselves.` : 'bit',
  bleh: (from, to) => from === to ? 'stuck out their tongue in front of the mirror.' : 'is making faces with their tongue at',
  bonk: (from, to, genero) => from === to ? `bonked themselves.` : 'hit',
  blush: (from, to) => from === to ? 'blushed.' : 'blushed because of',
  impregnate: (from, to) => from === to ? 'got pregnant.' : 'impregnated',
  bully: (from, to, genero) => from === to ? `is bullying themselves... someone to give them a hug.` : 'is bullying',
  cry: (from, to) => from === to ? 'is crying.' : 'is crying over',
  happy: (from, to) => from === to ? 'is happy.' : 'is happy with',
  coffee: (from, to) => from === to ? 'is drinking coffee.' : 'is drinking coffee with',
  clap: (from, to) => from === to ? 'is applauding for something.' : 'is applauding for',
  cringe: (from, to) => from === to ? 'feels cringe.' : 'feels cringe because of',
  dance: (from, to) => from === to ? 'is dancing.' : 'is dancing with',
  cuddle: (from, to, genero) => from === to ? `cuddled alone.` : 'cuddled with',
  drunk: (from, to, genero) => from === to ? `is too drunk.` : `is drunk with`,
  dramatic: (from, to) => from === to ? 'is making an exaggerated drama.' : 'is making a drama for',
  handhold: (from, to, genero) => from === to ? `held their own hand.` : 'held hands with',
  eat: (from, to) => from === to ? 'is eating something delicious.' : 'is eating with',
  highfive: (from, to) => from === to ? 'high-fived the mirror.' : 'high-fived',
  hug: (from, to, genero) => from === to ? `hugged themselves.` : 'gave a hug to',
  kill: (from, to) => from === to ? 'eliminated themselves in dramatic mode.' : 'assassinated',
  kiss: (from, to) => from === to ? 'blew a kiss into the air.' : 'gave a kiss to',
  kisscheek: (from, to) => from === to ? 'kissed themselves on the cheek using a mirror.' : 'gave a cheek kiss to',
  lick: (from, to) => from === to ? 'licked themselves out of curiosity.' : 'licked',
  laugh: (from, to) => from === to ? 'is laughing at something.' : 'is making fun of',
  pat: (from, to) => from === to ? 'petted their own head with tenderness.' : 'gave a pat to',
  love: (from, to, genero) => from === to ? `loves themselves a lot.` : 'feels attraction towards',
  pout: (from, to, genero) => from === to ? `is pouting alone.` : 'is pouting with',
  punch: (from, to) => from === to ? 'punched the air.' : 'gave a punch to',
  run: (from, to) => from === to ? 'is running for their life.' : 'is running with',
  scared: (from, to, genero) => from === to ? `is scared of something.` : `is scared by`,
  sad: (from, to) => from === to ? 'is sad.' : 'is expressing their sadness to',
  smoke: (from, to) => from === to ? 'is smoking calmly.' : 'is smoking with',
  smile: (from, to) => from === to ? 'is smiling.' : 'smiled at',
  spit: (from, to, genero) => from === to ? `spat on themselves by accident.` : 'spat on',
  smug: (from, to) => from === to ? 'is showing off a lot lately.' : 'is showing off',
  think: (from, to) => from === to ? 'is thinking deeply.' : 'can\'t stop thinking about',
  step: (from, to, genero) => from === to ? `stepped on themselves by accident.` : 'is stepping on',
  wave: (from, to, genero) => from === to ? `waved at themselves in the mirror.` : 'is waving at',
  walk: (from, to) => from === to ? 'went out for a walk in solitude.' : 'decided to take a walk with',
  wink: (from, to, genero) => from === to ? `winked at themselves in the mirror.` : 'winked at',
};

const alias = {
  angry: ['angry','enojado','enojada'],
  bleh: ['bleh','meh'],
  bored: ['bored','aburrido','aburrida'],
  clap: ['clap','aplaudir'],
  coffee: ['coffee','cafe'],
  dramatic: ['dramatic','drama'],
  drunk: ['drunk','ebria','ebrio'],
  cold: ['cold'],
  impregnate: ['impregnate','preg','preñar','embarazar'],
  kisscheek: ['kisscheek','beso','besar'],
  laugh: ['laugh','reír'],
  love: ['love','amor'],
  pout: ['pout','mueca'],
  punch: ['punch','golpear'],
  run: ['run','correr'],
  sad: ['sad','triste'],
  scared: ['scared','asustado','asustada'],
  seduce: ['seduce','seducir'],
  shy: ['shy','timido','timida'],
  sleep: ['sleep','dormir'],
  smoke: ['smoke','fumar'],
  spit: ['spit','escupir'],
  step: ['step','pisar'],
  think: ['think','pensar'],
  walk: ['walk','caminar'],
  hug: ['hug','abrazar'],
  kill: ['kill','matar'],
  eat: ['eat','nom','comer'],
  kiss: ['kiss','muak','besar'],
  wink: ['wink','guiñar'],
  pat: ['pat','acariciar'],
  happy: ['happy','feliz'],
  bully: ['bully','molestar'],
  bite: ['bite','morder'],
  blush: ['blush','sonrojarse'],
  wave: ['wave','saludar'],
  bath: ['bath','bañarse'],
  smug: ['smug','presumir'],
  smile: ['smile','sonreir'],
  highfive: ['highfive','chocar'],
  handhold: ['handhold','tomar'],
  cringe: ['cringe','avergonzarse','asco'],
  bonk: ['bonk','golpe'],
  cry: ['cry','llorar'],
  lick: ['lick','lamer'],
  slap: ['slap','bofetada'],
  dance: ['dance','bailar'],
  cuddle: ['cuddle','acurrucar'],
  sing: ['sing','cantar'],
  tickle: ['tickle','cosquillas'],
  scream: ['scream','gritar'],
  push: ['push','empujar'],
  nope: ['nope','nop'],
  jump: ['jump','saltar'],
  heat: ['heat','calor'],
  gaming: ['gaming','jugar'],
  draw: ['draw','dibujar'],
  call: ['call','llamar'],
  snuggle: ['snuggle','acurrucarse'],
  blowkiss: ['blowkiss','besito'],
  trip: ['trip','tropezar'],
  stare: ['stare','mirar'],
  sniff: ['sniff','oler'],
  curious: ['curious','curioso','curiosa'],
  thinkhard: ['thinkhard','pensar'],
  comfort: ['comfort','consolar'],
  peek: ['peek','mirar'],
};

const commandsList = [
  'angry','enojado','enojada','bleh','meh','bored','aburrido','aburrida','clap','aplaudir',
  'coffee','cafe','dramatic','drama','drunk','ebria','ebrio','cold','impregnate','preg',
  'preñar','embarazar','kisscheek','beso','besar','laugh','reír','love','amor','pout',
  'mueca','punch','golpear','run','correr','sad','triste','scared','asustado','asustada',
  'seduce','seducir','shy','timido','timida','sleep','dormir','smoke','fumar','spit',
  'escupir','step','pisar','think','pensar','walk','caminar','hug','abrazar','kill',
  'matar','eat','nom','comer','kiss','muak','wink','guiñar','pat','acariciar','happy',
  'feliz','bully','molestar','bite','morder','blush','sonrojarse','wave','saludar','bath',
  'bañarse','smug','presumir','smile','sonreir','highfive','chocar','handhold','tomar',
  'cringe','avergonzarse','asco','bonk','golpe','cry','llorar','lick','lamer','slap',
  'bofetada','dance','bailar','cuddle','acurrucar','sing','cantar','tickle','cosquillas',
  'scream','gritar','push','empujar','nope','nop','jump','saltar','heat','calor','gaming',
  'jugar','draw','dibujar','call','llamar','snuggle','acurrucarse','blowkiss','besito',
  'trip','tropezar','stare','mirar','sniff','oler','curious','curioso','curiosa','thinkhard',
  'comfort','consolar','peek'
];

export default {
  name: commandsList,
  description: 'Anime reaction commands.',
  category: 'anime',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const body = mek.text || mek.message?.conversation || mek.message?.extendedTextMessage?.text || '';
      const textWithoutPrefix = body.startsWith(prefix) ? body.slice(prefix.length) : body;
      const command = textWithoutPrefix.trim().split(' ')[0].toLowerCase();

      const currentCommand = Object.keys(alias).find(key => alias[key].includes(command)) || command;
      if (!captions[currentCommand]) return;

      const mentionedJid = mek.mentionedJid || mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const quotedSender = mek.quoted?.sender || mek.message?.extendedTextMessage?.contextInfo?.participant;
      const who = mentionedJid?.[0] || quotedSender || mek.sender;

      const fromName = db.getUser(mek.sender)?.name || '@' + mek.sender.split('@')[0];
      const toName = db.getUser(who)?.name || '@' + who.split('@')[0];
      const genero = db.getUser(mek.sender)?.genre || 'Oculto';

      const captionText = captions[currentCommand](fromName, toName, genero);
      const caption = who !== mek.sender 
        ? `\`${fromName}.\` ${captionText} \`${toName}.\` ${getRandomSymbol()}.` 
        : `\`${fromName}\` ${captionText} ${getRandomSymbol()}.`;

      const response = await fetch(`${global.APIs.yuki.url}/sfw/interaction?inter=${currentCommand}&key=${global.APIs.yuki.key}`);
      const json = await response.json();
      const result = json?.result || json?.url || json?.data;
      
      if (!result) throw new Error('No result from API.');

      await kaya.sendMessage(from, { 
        video: { url: result }, 
        gifPlayback: true, 
        caption, 
        mentions: [who, mek.sender] 
      }, { quoted: mek });

    } catch (e) {
      console.error('❌ Anime command error:', e);
      const body = mek.text || mek.message?.conversation || mek.message?.extendedTextMessage?.text || '';
      const command = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(' ')[0] : 'reaction';

      await kaya.sendMessage(from, { 
        text: `> An unexpected error occurred while executing command *${prefix + command}*. Please try again or contact support if the issue persists.\n> [Error: *${e.message}*]` 
      }, { quoted: mek });
    }
  }
};
