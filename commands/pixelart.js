import axios from 'axios';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { getBotName } from '../setting/botAssets.js';

export default {
    name: 'pixelart',
    aliases: ['pixel_art'],
    category: 'ai',
    description: 'Generate AI image in pixel art style',
    usage: '.pixelart <prompt>',

    async execute(kaya, mek, from, args, prefix) {
        const prompt = args.join(' ');
        const botName = getBotName(mek.sender);

        if (!prompt) {
            return await kaya.sendMessage(from, { 
                text: `❌ Please provide a prompt.\n\nExample: \`${prefix}pixelart A futuristic city\`` 
            }, { quoted: mek });
        }

        // Réaction "⏳"
        await kaya.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        try {
            const style = 'pixel_art';
            const baseUrl = 'https://text2img.hideme.eu.org';
            const apiUrl = `${baseUrl}/image?prompt=${encodeURIComponent(prompt)}&model=flux&style=${style}`;

            const response = await axios({ 
                method: 'get', 
                url: apiUrl, 
                responseType: 'arraybuffer',
                timeout: 60000 
            });

            const imageBuffer = Buffer.from(response.data);
            const tempFile = path.join(tmpdir(), `kaya_pixelart_${Date.now()}.png`);

            await writeFile(tempFile, imageBuffer);

            await kaya.sendMessage(from, { 
                image: { url: tempFile }, 
                caption: `🎨 *Prompt:* ${prompt}\n✨ *Style:* Pixel Art\n> *Powered by ${botName}*`
            }, { quoted: mek });

            // Nettoyage du fichier temporaire
            await unlink(tempFile).catch(() => {});
            
            // Réaction "✅"
            await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });

        } catch (error) {
            console.error('PixelArt command error:', error);
            await kaya.sendMessage(from, { text: `❌ Failed: ${error.message}` }, { quoted: mek });
            
            // Réaction "❌"
            await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
        }
    }
};
