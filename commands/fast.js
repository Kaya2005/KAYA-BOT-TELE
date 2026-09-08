// ================= commands/fast.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

const games = new Map();

const challenges = [
  // 🧮 MATH
  {
    question: 'What is 5 + 7?',
    answer: '12'
  },
  {
    question: 'What is 9 × 3?',
    answer: '27'
  },
  {
    question: 'What is 20 - 8?',
    answer: '12'
  },
  {
    question: 'What is 15 + 16?',
    answer: '31'
  },
  {
    question: 'What is 50 - 25?',
    answer: '25'
  },
  {
    question: 'What is 8 × 8?',
    answer: '64'
  },
  {
    question: 'What is 100 ÷ 10?',
    answer: '10'
  },
  {
    question: 'What is 7 × 7?',
    answer: '49'
  },
  {
    question: 'What is 45 + 5?',
    answer: '50'
  },
  {
    question: 'What is 90 - 35?',
    answer: '55'
  },

  // 🌍 GENERAL KNOWLEDGE
  {
    question: 'What is the capital of France?',
    answer: 'paris'
  },
  {
    question: 'What is the capital of the Democratic Republic of Congo?',
    answer: 'kinshasa'
  },
  {
    question: 'What is the largest continent?',
    answer: 'asia'
  },
  {
    question: 'What is the largest ocean?',
    answer: 'pacific'
  },
  {
    question: 'How many days are there in a week?',
    answer: '7'
  },
  {
    question: 'How many months are there in a year?',
    answer: '12'
  },
  {
    question: 'How many days are there in a normal year?',
    answer: '365'
  },
  {
    question: 'What planet is known as the Red Planet?',
    answer: 'mars'
  },
  {
    question: 'What is the closest planet to the Sun?',
    answer: 'mercury'
  },
  {
    question: 'What is the largest planet in our Solar System?',
    answer: 'jupiter'
  },

  // 🧠 LOGIC
  {
    question: 'How many letters are in the English alphabet?',
    answer: '26'
  },
  {
    question: 'How many sides does a triangle have?',
    answer: '3'
  },
  {
    question: 'How many sides does a square have?',
    answer: '4'
  },
  {
    question: 'How many legs does a spider have?',
    answer: '8'
  },
  {
    question: 'How many fingers are on one hand?',
    answer: '5'
  },
  {
    question: 'How many wheels does a bicycle have?',
    answer: '2'
  },
  {
    question: 'How many hours are there in one day?',
    answer: '24'
  },
  {
    question: 'How many minutes are there in one hour?',
    answer: '60'
  },
  {
    question: 'How many seconds are there in one minute?',
    answer: '60'
  },
  {
    question: 'What comes after 99?',
    answer: '100'
  },

  // 🐶 ANIMALS
  {
    question: 'Which animal is known as the king of the jungle?',
    answer: 'lion'
  },
  {
    question: 'Which animal is the largest land animal?',
    answer: 'elephant'
  },
  {
    question: 'Which animal says "meow"?',
    answer: 'cat'
  },
  {
    question: 'Which animal says "woof"?',
    answer: 'dog'
  },
  {
    question: 'What is the fastest land animal?',
    answer: 'cheetah'
  },

  // 🔤 WORD CHALLENGES
  {
    question: 'Type exactly: KAYA',
    answer: 'kaya'
  },
  {
    question: 'Type exactly: BOT',
    answer: 'bot'
  },
  {
    question: 'Type exactly: WHATSAPP',
    answer: 'whatsapp'
  },
  {
    question: 'Type exactly: TELEGRAM',
    answer: 'telegram'
  },
  {
    question: 'Type exactly: GAME',
    answer: 'game'
  },
  {
    question: 'Type exactly: FAST',
    answer: 'fast'
  },
  {
    question: 'Type exactly: HELLO',
    answer: 'hello'
  },
  {
    question: 'Type exactly: WINNER',
    answer: 'winner'
  },
  {
    question: 'Type exactly: CHAMPION',
    answer: 'champion'
  },
  {
    question: 'Type exactly: KAYABOT',
    answer: 'kayabot'
  },

  // ⚡ TRICK QUESTIONS
  {
    question: 'What comes after Monday?',
    answer: 'tuesday'
  },
  {
    question: 'What comes before Friday?',
    answer: 'thursday'
  },
  {
    question: 'What is 1 + 1?',
    answer: '2'
  },
  {
    question: 'What is 10 × 0?',
    answer: '0'
  },
  {
    question: 'What is half of 10?',
    answer: '5'
  }
];

export default {
  name: 'fast',
  description: 'Answer a challenge as quickly as possible',
  category: 'Games',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const key = `${from}:${mek.sender}`;

      // 🚀 START GAME
      if (!games.has(key)) {
        const challenge =
          challenges[Math.floor(Math.random() * challenges.length)];

        games.set(key, {
          ...challenge,
          startedAt: Date.now()
        });

        return await sendWithBotImage(kaya, from, mek.sender, {
          caption:
`⚡ *FAST CHALLENGE*

━━━━━━━━━━━━━━

🚨 *QUICK! QUICK! QUICK!*

❓ *${challenge.question}*

⏱️ You have *10 seconds!*

👉 Answer with:

\`${prefix}fast answer\`

━━━━━━━━━━━━━━

🏃💨 *GO GO GO!*`
        });
      }

      // 🧠 GET ACTIVE GAME
      const game = games.get(key);

      const elapsed = (Date.now() - game.startedAt) / 1000;

      const answer = args
        .join(' ')
        .toLowerCase()
        .trim();

      // ⏰ TIME LIMIT
      games.delete(key);

      if (elapsed > 10) {
        return await kaya.sendMessage(from, {
          text:
`⏰ *TOO SLOW!*

You took *${elapsed.toFixed(1)} seconds* 😂

💀 You missed the challenge!

Try again with:
${prefix}fast`
        }, { quoted: mek });
      }

      // 🏆 CORRECT ANSWER
      if (answer === game.answer.toLowerCase()) {
        return await sendWithBotImage(kaya, from, mek.sender, {
          caption:
`⚡ *LIGHTNING FAST!*

━━━━━━━━━━━━━━

🏆 *CORRECT ANSWER!*

⏱️ Time:
*${elapsed.toFixed(1)} seconds*

🔥 You're FAST!

━━━━━━━━━━━━━━

🎮 Play again:
\`${prefix}fast\``
        });
      }

      // ❌ WRONG ANSWER
      return await kaya.sendMessage(from, {
        text:
`❌ *WRONG ANSWER!* 😂

━━━━━━━━━━━━━━

Your answer:
*${answer || 'Nothing'}*

Correct answer:
*${game.answer}*

━━━━━━━━━━━━━━

😈 Better luck next time!

Try again:
${prefix}fast`
      }, { quoted: mek });

    } catch (err) {
      console.error('❌ fast.js error:', err);

      return await kaya.sendMessage(from, {
        text: '❌ An error occurred in the Fast Challenge.'
      }, { quoted: mek });
    }
  }
};