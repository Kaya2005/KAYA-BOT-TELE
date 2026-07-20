import axios from 'axios';

export default {
    name: 'valentine',
    aliases: ['valentines', 'valentinesday'],
    category: 'fun',
    description: '❤️ Get a random Valentine’s Day wish',
    usage: '.valentine',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Réaction initiale
            await kaya.sendMessage(from, { react: { text: '❤️', key: mek.key } });

            // Configuration API
            const baseUrl = 'https://api.princetechn.com/api';
            const apikey = 'prince';

            const res = await axios.get(`${baseUrl}/fun/valentines`, { 
                params: { apikey }, 
                timeout: 30000 
            });

            if (res.data?.result) {
                await kaya.sendMessage(from, { text: res.data.result }, { quoted: mek });
            } else {
                await kaya.sendMessage(from, { text: '❌ No wish found.' }, { quoted: mek });
            }

            // Réaction finale
            await kaya.sendMessage(from, { react: { text: '✅', key: mek.key } });
            
        } catch (e) {
            console.error('Valentine error:', e);
            await kaya.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: mek });
            await kaya.sendMessage(from, { react: { text: '❌', key: mek.key } });
        }
    }
};
