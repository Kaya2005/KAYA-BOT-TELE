// ================= commands/joke.js =================

import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

export default {
  name: 'joke',
  description: 'Get a random joke 😂',
  category: 'Fun',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const jokes = [
        `😂 Why did the programmer quit his job?\n\nBecause he didn't get arrays! 😭`,
        `🤣 Why was the computer cold?\n\nIt left its Windows open! 🪟`,
        `😂 Why did the phone go to school?\n\nTo improve its cell-f! 📱`,
        `🤣 What do programmers do when they're hungry?\n\nThey grab a byte! 🍔`,
        `😂 Why did the developer go broke?\n\nBecause he used up all his cache! 💸`,
        `🤣 Why don't programmers like nature?\n\nToo many bugs! 🐛`,
        `😂 What did the Wi-Fi say to the phone?\n\n"I feel a connection." ❤️`,
        `🤣 Why did the JavaScript developer wear glasses?\n\nBecause he couldn't C#! 🤓`,
        `😂 What is a programmer's favorite place?\n\nThe server room! 🖥️`,
        `🤣 Why was the keyboard tired?\n\nIt had too many shifts! ⌨️`
      ];

      const joke = jokes[Math.floor(Math.random() * jokes.length)];

      const caption = `😂 *KAYA JOKE*

${joke}

🤣 Hope that made you laugh!`;

      return await sendWithBotImage(kaya, from, mek.sender, {
        caption
      });

    } catch (err) {
      console.error('❌ joke.js:', err);
      return await kaya.sendMessage(from, {
        text: '❌ Something went wrong.'
      }, { quoted: mek });
    }
  }
};