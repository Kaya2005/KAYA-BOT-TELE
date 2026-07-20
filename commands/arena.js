import mumaker from 'mumaker';
import { getBotName } from '../setting/botAssets.js';

export default {
    name: 'arena',
    aliases: [],
    category: 'textmaker',
    description: 'Create arena text effect',
    usage: '.arena <text>',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const text = args.join(' ');
            const botName = getBotName(mek.sender);

            if (!text) {
                return await kaya.sendMessage(from, { 
                    text: `⚠️ Please provide text to generate.\nExample: \`${prefix}arena Nick\`` 
                }, { quoted: mek });
            }

            // Réaction de chargement
            await kaya.sendMessage(from, { react: { text: '⏳', key: mek.key } });

            const result = await mumaker.ephoto('https://en.ephoto360.com/create-cover-arena-of-valor-by-mastering-360.html', text);

            if (!result || !result.image) {
                throw new Error('No image URL received from the API');
            }

            await kaya.sendMessage(from, {
                image: { url: result.image },
                caption: `✨ *Arena Effect Generated*\n\n> *Powered by ${botName}*`
            }, { quoted: mek });

            await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });

        } catch (error) {
            console.error('Error in arena command:', error);
            await kaya.sendMessage(from, { 
                text: `❌ Error: ${error.message}` 
            }, { quoted: mek });
            await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
        }
    }
};
