import axios from 'axios';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { getBotName } from '../setting/botAssets.js';

export default {
    name: 'gsticker',
    aliases: ['gensticker', 'stickerai'],
    category: 'ai',
    description: 'Generate AI image in sticker style',
    usage: '.generatesticker <prompt>',

    async execute(kaya, mek, from, args, prefix) {
        const prompt = args.join(' ');
        const botName = getBotName(mek.sender);

        if (!prompt) {
            return await kaya.sendMessage(from, { 
                text: `❌ Please provide a prompt.\n\nExample: \`${prefix}generatesticker A cute cat sticker\`` 
            }, { quoted: mek });
        }

        // Réaction "⏳"
        await kaya.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        try {
            const style = 'sticker';
            const baseUrl = 'https://text2img.hideme.eu.org';
            const apiUrl = `${baseUrl}/image?prompt=${encodeURIComponent(prompt)}&model=flux&style=${style}`;

            const response = await axios({ 
                method: 'get', 
                url: apiUrl, 
                responseType: 'arraybuffer',
                timeout: 60000 
            });

            const imageBuffer = Buffer.from(response.data);
            const tempFile = path.join(tmpdir(), `kaya_sticker_${Date.now()}.png`);

            await writeFile(tempFile, imageBuffer);

            await kaya.sendMessage(from, { 
                image: { url: tempFile }, 
                caption: `🎨 *Prompt:* ${prompt}\n✨ *Style:* Sticker\n> *Powered by ${botName}*`
            }, { quoted: mek });

            // Nettoyage du fichier temporaire
            await unlink(tempFile).catch(() => {});
            
            // Réaction "✅"
            await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });

        } catch (error) {
            console.error('Generatesticker command error:', error);
            await kaya.sendMessage(from, { text: `❌ Failed: ${error.message}` }, { quoted: mek });
            
            // Réaction "❌"
            await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
        }
    }
};
