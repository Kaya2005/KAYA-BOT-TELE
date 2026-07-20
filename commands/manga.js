import axios from 'axios';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { getBotName } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
    name: 'manga',
    aliases: ['anime', 'manga-ai'],
    category: 'ai',
    description: 'Generate AI image in manga style',
    usage: '.manga <prompt>',

    async execute(kaya, mek, from, args, prefix) {
        const prompt = args.join(' ');
        
        if (!prompt) {
            return await kaya.sendMessage(from, { 
                text: `❌ Please provide a prompt.\n\nExample: \`${prefix}manga A samurai in Tokyo\`` 
            }, { quoted: mek });
        }

        // Réaction "⏳"
        await kaya.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        try {
            const style = 'manga';
            // Utilisation d'une URL générique (adapte selon ton config.js si besoin)
            const apiUrl = `https://text2img.hideme.eu.org/image?prompt=${encodeURIComponent(prompt)}&model=flux&style=${style}`;
            
            const response = await axios({ 
                method: 'get', 
                url: apiUrl, 
                responseType: 'arraybuffer',
                timeout: 60000 
            });

            const imageBuffer = Buffer.from(response.data);
            const tempFile = path.join(tmpdir(), `kaya_ai_${Date.now()}.png`);
            
            await writeFile(tempFile, imageBuffer);

            await kaya.sendMessage(from, { 
                image: { url: tempFile }, 
                caption: `🎨 *Prompt:* ${prompt}\n✨ *Style:* Manga\n🧠 *Powered by ${getBotName(mek.sender)}*`,
                contextInfo: getContextInfo()
            }, { quoted: mek });

            // Nettoyage du fichier temporaire
            await unlink(tempFile).catch(() => {});
            
            // Réaction "✅"
            await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });

        } catch (error) {
            console.error('Manga command error:', error);
            await kaya.sendMessage(from, { text: `❌ Failed: ${error.message}` }, { quoted: mek });
            
            // Réaction "❌"
            await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
        }
    }
};
