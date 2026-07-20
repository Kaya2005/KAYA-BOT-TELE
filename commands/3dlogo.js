import axios from 'axios';
import { getBotName } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

const API_BASE = 'https://ammar-3d-logo-generate-api.vercel.app/generate-logo';

export default {
    name: '3dlogo',
    aliases: ['logo3d', 'genlogo', 'logogen'],
    category: 'ai',
    description: 'Generate 3D logo images from a text prompt',
    usage: '.3dlogo <prompt>',

    async execute(kaya, mek, from, args, prefix) {
        const prompt = args.join(' ').trim();
        const sender = mek.sender;
        const botName = getBotName(sender);

        if (!prompt) {
            return await kaya.sendMessage(from, { 
                text: `❌ Please provide a prompt!\n\nExample: \`${prefix}3dlogo neon gaming logo\`` 
            }, { quoted: mek });
        }

        // Notification de début
        await kaya.sendMessage(from, { text: `🎨 Generating 3D logo for: *${prompt}*...` }, { quoted: mek });

        try {
            const response = await axios.get(API_BASE, {
                params: { prompt },
                timeout: 90000 // 90 seconds
            });

            const data = response.data;
            if (!data.success) {
                return await kaya.sendMessage(from, { text: `❌ API Error: ${data.error || 'Unknown error'}` }, { quoted: mek });
            }

            const images = data.data?.images;
            if (!images || !Array.isArray(images) || images.length === 0) {
                return await kaya.sendMessage(from, { text: '❌ No images generated.' }, { quoted: mek });
            }

            // Envoi des images générées
            for (let i = 0; i < images.length; i++) {
                const imageUrl = images[i];
                const caption = i === 0 
                    ? `✨ *3D Logo Generated!*\n📝 Prompt: ${prompt}\n\n> *Powered by ${botName}*`
                    : `📸 Variation ${i + 1}`;
                
                await kaya.sendMessage(from, {
                    image: { url: imageUrl },
                    caption: caption,
                    contextInfo: getContextInfo() // Utilisation de ton contextInfo personnalisé
                }, { quoted: mek });
                
                // Petit délai pour éviter les limites de débit
                if (i < images.length - 1) await new Promise(r => setTimeout(r, 500));
            }

        } catch (error) {
            console.error('3dlogo error:', error.message);
            let errorMsg = '❌ Failed to generate logo.';
            if (error.code === 'ECONNABORTED') errorMsg = '❌ Generation timed out. Try a shorter prompt.';
            else if (error.response?.data?.error) errorMsg = `❌ ${error.response.data.error}`;
            
            await kaya.sendMessage(from, { text: errorMsg }, { quoted: mek });
        }
    }
};
