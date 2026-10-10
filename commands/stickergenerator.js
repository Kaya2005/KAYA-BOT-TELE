import axios from 'axios';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { getBotName } from '../setting/botAssets.js';

export default {
    name: 'gsticker',
    aliases: ['gensticker', 'stickerai'],
    category: 'ai',
    description: 'Generate AI image in sticker style with fallback APIs',
    usage: '.gsticker <prompt>',

    async execute(kaya, mek, from, args, prefix) {
        const prompt = args.join(' ');
        const botName = getBotName(mek.sender);

        if (!prompt) {
            return await kaya.sendMessage(from, { 
                text: `❌ Please provide a prompt.\n\nExample: \`${prefix}gsticker A cute cat sticker\`` 
            }, { quoted: mek });
        }

        // Réaction "⏳"
        await kaya.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const fullPrompt = `${prompt} sticker style, vector art, white background`;
        let imageBuffer = null;

        try {
            // ==================== TENTATIVE API 1 (Pollinations AI) ====================
            try {
                const seed = Math.floor(Math.random() * 1000000);
                const apiUrl1 = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=512&height=512&seed=${seed}&model=flux&nologo=true`;

                const response1 = await axios({ 
                    method: 'get', 
                    url: apiUrl1, 
                    responseType: 'arraybuffer',
                    timeout: 30000 
                });

                imageBuffer = Buffer.from(response1.data);
            } catch (err1) {
                console.warn('⚠️ API 1 (Pollinations) failed, switching to API 2...', err1.message);

                // ==================== TENTATIVE API 2 (Vreden API - Fallback) ====================
                const apiUrl2 = `https://api.vreden.web.id/api/ai/flux?prompt=${encodeURIComponent(fullPrompt)}`;

                const response2 = await axios({ 
                    method: 'get', 
                    url: apiUrl2, 
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    },
                    timeout: 30000 
                });

                imageBuffer = Buffer.from(response2.data);
            }

            // Enregistrement et envoi de l'image obtenue
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
            console.error('Generatesticker command error (all APIs failed):', error);
            await kaya.sendMessage(from, { text: `❌ Failed: All image generation APIs are currently unavailable.` }, { quoted: mek });
            
            // Réaction "❌"
            await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
        }
    }
};
