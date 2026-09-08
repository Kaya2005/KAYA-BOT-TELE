// ================= commands/word.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

const games = new Map();

const wordBank = {

  // 🟢 EASY
  easy: [
    { word: 'apple', hint: '🍎 A fruit' },
    { word: 'banana', hint: '🍌 A yellow fruit' },
    { word: 'orange', hint: '🍊 A citrus fruit' },
    { word: 'water', hint: '💧 You drink it' },
    { word: 'house', hint: '🏠 You live in it' },
    { word: 'school', hint: '🏫 Students go here' },
    { word: 'phone', hint: '📱 You use it to call' },
    { word: 'music', hint: '🎵 You listen to it' },
    { word: 'movie', hint: '🎬 You watch it' },
    { word: 'game', hint: '🎮 You play it' },
    { word: 'car', hint: '🚗 A vehicle' },
    { word: 'book', hint: '📖 You read it' },
    { word: 'table', hint: '🪑 Furniture' },
    { word: 'chair', hint: '🪑 You sit on it' },
    { word: 'door', hint: '🚪 You open it' },
    { word: 'bread', hint: '🍞 Food' },
    { word: 'pizza', hint: '🍕 Popular food' },
    { word: 'coffee', hint: '☕ A hot drink' },
    { word: 'watermelon', hint: '🍉 A big fruit' },
    { word: 'chicken', hint: '🐔 An animal and food' },
    { word: 'dog', hint: '🐶 A popular pet' },
    { word: 'cat', hint: '🐱 It says meow' },
    { word: 'lion', hint: '🦁 King of the jungle' },
    { word: 'fish', hint: '🐟 Lives in water' },
    { word: 'bird', hint: '🐦 It can fly' },
    { word: 'sun', hint: '☀️ It shines' },
    { word: 'moon', hint: '🌙 You see it at night' },
    { word: 'star', hint: '⭐ You see it in the sky' },
    { word: 'fire', hint: '🔥 It is hot' },
    { word: 'rain', hint: '🌧️ Falls from clouds' },
    { word: 'school', hint: '🎓 Place to learn' },
    { word: 'teacher', hint: '👨‍🏫 Gives lessons' },
    { word: 'friend', hint: '🤝 Someone close to you' },
    { word: 'family', hint: '👨‍👩‍👧 People close to you' },
    { word: 'king', hint: '👑 Royal person' },
    { word: 'queen', hint: '👸 Female royal' },
    { word: 'baby', hint: '👶 Very young human' },
    { word: 'happy', hint: '😊 Opposite of sad' },
    { word: 'black', hint: '⚫ A color' },
    { word: 'white', hint: '⚪ A color' }
  ],

  // 🟡 MEDIUM
  medium: [
    { word: 'computer', hint: '💻 Electronic device' },
    { word: 'internet', hint: '🌐 Global network' },
    { word: 'whatsapp', hint: '💬 Messaging app' },
    { word: 'telegram', hint: '✈️ Messaging app' },
    { word: 'keyboard', hint: '⌨️ Used for typing' },
    { word: 'website', hint: '🌐 Page on the internet' },
    { word: 'software', hint: '💾 Runs on a computer' },
    { word: 'android', hint: '📱 Mobile operating system' },
    { word: 'football', hint: '⚽ Popular sport' },
    { word: 'basketball', hint: '🏀 Sport with a hoop' },
    { word: 'champion', hint: '🏆 A winner' },
    { word: 'adventure', hint: '🗺️ Exciting experience' },
    { word: 'mountain', hint: '⛰️ Very high land' },
    { word: 'ocean', hint: '🌊 Huge body of water' },
    { word: 'island', hint: '🏝️ Land surrounded by water' },
    { word: 'desert', hint: '🏜️ Very dry place' },
    { word: 'forest', hint: '🌲 Lots of trees' },
    { word: 'elephant', hint: '🐘 Very large animal' },
    { word: 'giraffe', hint: '🦒 Has a long neck' },
    { word: 'penguin', hint: '🐧 Bird that cannot fly' },
    { word: 'dolphin', hint: '🐬 Intelligent sea animal' },
    { word: 'crocodile', hint: '🐊 Dangerous reptile' },
    { word: 'butterfly', hint: '🦋 Colorful insect' },
    { word: 'sunshine', hint: '☀️ Light from the sun' },
    { word: 'thunder', hint: '⛈️ Loud sound during storms' },
    { word: 'rainbow', hint: '🌈 Colorful sky phenomenon' },
    { word: 'electricity', hint: '⚡ Powers devices' },
    { word: 'battery', hint: '🔋 Stores electrical energy' },
    { word: 'camera', hint: '📷 Takes pictures' },
    { word: 'television', hint: '📺 You watch programs on it' },
    { word: 'headphones', hint: '🎧 Used to listen privately' },
    { word: 'restaurant', hint: '🍽️ Place to eat' },
    { word: 'hospital', hint: '🏥 Medical place' },
    { word: 'airport', hint: '✈️ Planes arrive here' },
    { word: 'library', hint: '📚 Place full of books' },
    { word: 'football', hint: '⚽ Sport played with a ball' },
    { word: 'language', hint: '🗣️ Used to communicate' },
    { word: 'country', hint: '🌍 A nation' },
    { word: 'capital', hint: '🏛️ Main city of a country' },
    { word: 'universe', hint: '🌌 Everything in space' }
  ],

  // 🔴 HARD
  hard: [
    { word: 'technology', hint: '💻 Science and machines' },
    { word: 'programming', hint: '👨‍💻 Writing computer code' },
    { word: 'javascript', hint: '🟨 Programming language' },
    { word: 'developer', hint: '👨‍💻 Creates software' },
    { word: 'artificial', hint: '🤖 Not naturally occurring' },
    { word: 'intelligence', hint: '🧠 Ability to learn and understand' },
    { word: 'communication', hint: '📡 Exchange of information' },
    { word: 'information', hint: '📚 Knowledge or data' },
    { word: 'environment', hint: '🌍 Natural surroundings' },
    { word: 'electricity', hint: '⚡ Flow of electric charge' },
    { word: 'engineering', hint: '⚙️ Design and build things' },
    { word: 'photovoltaic', hint: '☀️ Converts sunlight into electricity' },
    { word: 'experiment', hint: '🧪 Scientific test' },
    { word: 'knowledge', hint: '🧠 What you know' },
    { word: 'imagination', hint: '💭 Ability to create ideas' },
    { word: 'creativity', hint: '🎨 Ability to create something new' },
    { word: 'competition', hint: '🏆 Contest between people' },
    { word: 'motivation', hint: '🔥 Reason to keep going' },
    { word: 'opportunity', hint: '🚪 A chance to do something' },
    { word: 'responsibility', hint: '🫡 Something you are expected to do' },
    { word: 'architecture', hint: '🏛️ Design of buildings' },
    { word: 'astronaut', hint: '🚀 Person who travels to space' },
    { word: 'galaxy', hint: '🌌 Huge group of stars' },
    { word: 'planet', hint: '🪐 Orbits a star' },
    { word: 'microscope', hint: '🔬 Makes tiny things visible' },
    { word: 'laboratory', hint: '🧪 Place for scientific work' },
    { word: 'psychology', hint: '🧠 Study of the mind' },
    { word: 'philosophy', hint: '🤔 Study of fundamental questions' },
    { word: 'democracy', hint: '🗳️ Government by the people' },
    { word: 'government', hint: '🏛️ Runs a country' },
    { word: 'international', hint: '🌍 Involving multiple countries' },
    { word: 'extraordinary', hint: '🔥 Very unusual or impressive' },
    { word: 'determination', hint: '💪 Strong decision to achieve something' },
    { word: 'successful', hint: '🏆 Having achieved a goal' },
    { word: 'adrenaline', hint: '⚡ Hormone linked to excitement' },
    { word: 'cryptocurrency', hint: '₿ Digital currency' },
    { word: 'blockchain', hint: '🔗 Technology behind many cryptocurrencies' },
    { word: 'cybersecurity', hint: '🔐 Protection of computer systems' },
    { word: 'algorithm', hint: '🤖 Step-by-step computational method' }
  ]
};

// 🎯 Choose difficulty randomly
function getRandomDifficulty() {
  const difficulties = ['easy', 'easy', 'medium', 'medium', 'hard'];
  return difficulties[Math.floor(Math.random() * difficulties.length)];
}

// 🔤 Display hidden word
function displayWord(game) {
  return [...game.word]
    .map(letter =>
      game.guessed.includes(letter) ? letter.toUpperCase() : '•'
    )
    .join(' ');
}

// 📊 Calculate progress
function getProgress(game) {
  const found = [...new Set(game.word)]
    .filter(letter => game.guessed.includes(letter))
    .length;

  const total = [...new Set(game.word)].length;

  return Math.floor((found / total) * 100);
}

// 🎁 Get random word
function getRandomWord(difficulty) {
  const list = wordBank[difficulty];

  return list[Math.floor(Math.random() * list.length)];
}

export default {
  name: 'word',
  description: 'Find the secret word',
  category: 'Games',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const key = `${from}:${mek.sender}`;

      // ================= START GAME =================

      if (!games.has(key)) {

        const difficulty = getRandomDifficulty();
        const selected = getRandomWord(difficulty);

        games.set(key, {
          word: selected.word,
          hint: selected.hint,
          guessed: [],
          attempts: difficulty === 'easy'
            ? 7
            : difficulty === 'medium'
              ? 6
              : 5,
          difficulty,
          hintsUsed: 0,
          startedAt: Date.now()
        });

        const game = games.get(key);

        return await sendWithBotImage(kaya, from, mek.sender, {
          caption:
`🔠 *KAYA WORD GAME*

━━━━━━━━━━━━━━━━━━

🎯 *Difficulty:* ${difficulty.toUpperCase()}

🔤 *Word:*
${'• '.repeat(game.word.length)}

❤️ *Attempts:* ${game.attempts}

💡 *Hint:* ${game.hint}

📊 *Progress:* 0%

━━━━━━━━━━━━━━━━━━

👉 Guess a letter:

\`${prefix}word a\`

😈 Or try the whole word!

🏃 *Good luck!*`
        });
      }

      const game = games.get(key);

      const answer = args
        .join('')
        .toLowerCase()
        .trim();

      // ================= EMPTY ANSWER =================

      if (!answer) {
        return await kaya.sendMessage(from, {
          text:
`❌ *NO ANSWER!*

Send a letter or try the whole word.

Example:
\`${prefix}word a\``
        }, { quoted: mek });
      }

      // ================= WHOLE WORD =================

      if (answer.length > 1) {

        if (answer === game.word) {

          const elapsed =
            ((Date.now() - game.startedAt) / 1000).toFixed(1);

          const score =
            game.attempts * 100 +
            Math.max(0, 300 - Math.floor(elapsed * 10));

          games.delete(key);

          return await sendWithBotImage(kaya, from, mek.sender, {
            caption:
`🏆 *PERFECT VICTORY!*

━━━━━━━━━━━━━━━━━━

🔠 Word:
*${game.word.toUpperCase()}*

🎯 Difficulty:
*${game.difficulty.toUpperCase()}*

⏱️ Time:
*${elapsed}s*

❤️ Attempts remaining:
*${game.attempts}*

💰 Score:
*${score} points*

🔥 You guessed the entire word!

👑 *WORD MASTER!*`
          });
        }

        game.attempts--;

        if (game.attempts <= 0) {

          games.delete(key);

          return await kaya.sendMessage(from, {
            text:
`💀 *GAME OVER!*

━━━━━━━━━━━━━━━━━━

❌ Wrong word!

🔤 The word was:
*${game.word.toUpperCase()}*

😈 Better luck next time!

Try:
\`${prefix}word\``
          }, { quoted: mek });
        }

        return await kaya.sendMessage(from, {
          text:
`❌ *WRONG WORD!* 😂

You guessed:
*${answer.toUpperCase()}*

❤️ Attempts left:
*${game.attempts}*

💡 Hint:
${game.hint}

🔥 Keep going!`
        }, { quoted: mek });
      }

      // ================= LETTER =================

      const letter = answer;

      if (!/^[a-z]$/.test(letter)) {
        return await kaya.sendMessage(from, {
          text:
`❌ *INVALID INPUT!*

Send only one letter.

Example:
\`${prefix}word k\``
        }, { quoted: mek });
      }

      // ================= DUPLICATE LETTER =================

      if (game.guessed.includes(letter)) {
        return await kaya.sendMessage(from, {
          text:
`👀 *ALREADY TRIED!*

You already guessed:
*${letter.toUpperCase()}*

Try another letter! 😈`
        }, { quoted: mek });
      }

      game.guessed.push(letter);

      // ================= CORRECT LETTER =================

      if (game.word.includes(letter)) {

        const display = displayWord(game);
        const progress = getProgress(game);

        // 🎉 Complete word
        if (![...game.word].some(
          l => !game.guessed.includes(l)
        )) {

          const elapsed =
            ((Date.now() - game.startedAt) / 1000).toFixed(1);

          const score =
            game.attempts * 100 +
            Math.max(0, 300 - Math.floor(elapsed * 10));

          games.delete(key);

          return await sendWithBotImage(kaya, from, mek.sender, {
            caption:
`🎉 *WORD COMPLETED!*

━━━━━━━━━━━━━━━━━━

🔠 *${game.word.toUpperCase()}*

🎯 Difficulty:
*${game.difficulty.toUpperCase()}*

⏱️ Time:
*${elapsed}s*

❤️ Attempts left:
*${game.attempts}*

📊 Progress:
*100%*

💰 Score:
*${score} points*

━━━━━━━━━━━━━━━━━━

🏆 *YOU ARE A WORD MASTER!* 👑

Play again:
\`${prefix}word\``
          });
        }

        return await kaya.sendMessage(from, {
          text:
`✅ *NICE! CORRECT LETTER!* 🔥

🔠 ${display}

❤️ Attempts:
*${game.attempts}*

📊 Progress:
*${progress}%*

💡 Hint:
${game.hint}

👉 Continue:
\`${prefix}word letter\``
        }, { quoted: mek });
      }

      // ================= WRONG LETTER =================

      game.attempts--;

      const display = displayWord(game);
      const progress = getProgress(game);

      // 💀 No attempts
      if (game.attempts <= 0) {

        games.delete(key);

        return await kaya.sendMessage(from, {
          text:
`💀 *GAME OVER!*

━━━━━━━━━━━━━━━━━━

🔠 The secret word was:
*${game.word.toUpperCase()}*

❌ You ran out of attempts!

😈 Don't give up!

Try again:
\`${prefix}word\``
        }, { quoted: mek });
      }

      // 💡 Give a hint after 2 mistakes
      let extraHint = '';

      if (
        game.attempts <= 3 &&
        game.hintsUsed === 0
      ) {

        game.hintsUsed++;

        const hiddenLetters =
          [...new Set(game.word)]
            .filter(l => !game.guessed.includes(l));

        if (hiddenLetters.length > 0) {

          const randomHint =
            hiddenLetters[
              Math.floor(Math.random() * hiddenLetters.length)
            ];

          extraHint =
`\n\n💡 *BONUS HINT:*
The word contains the letter *${randomHint.toUpperCase()}* 😈`;
        }
      }

      return await kaya.sendMessage(from, {
        text:
`❌ *WRONG LETTER!* 😂

You tried:
*${letter.toUpperCase()}*

🔠 ${display}

❤️ Attempts left:
*${game.attempts}*

📊 Progress:
*${progress}%*

💡 Hint:
${game.hint}${extraHint}

🔥 Don't give up!

👉 \`${prefix}word letter\``
      }, { quoted: mek });

    } catch (err) {

      console.error('❌ word.js error:', err);

      return await kaya.sendMessage(from, {
        text:
`❌ *WORD GAME ERROR!*

Something went wrong.

Please try again:
\`${prefix}word\``
      }, { quoted: mek });
    }
  }
};