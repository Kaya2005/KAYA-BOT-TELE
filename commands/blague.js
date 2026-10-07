// ================= commands/blague.js =================
import axios from 'axios';

// 🔹 Free Translation Function
async function translateToFrench(text) {
    try {
        const res = await axios.get('https://api.mymemory.translated.net/get', {
            params: {
                q: text,
                langpair: 'en|fr'
            },
            timeout: 5000
        });

        return res.data.responseData.translatedText || text;
    } catch {
        return text; // fallback
    }
}

export default {
    name: 'blague',
    category: 'Fun',
    description: 'Sends a random translated "dad joke" in French.',

    async execute(kaya, mek, from, args, prefix) {
        try {
            await kaya.sendMessage(from, { react: { text: '😂', key: mek.key } });

            let joke = null;

            for (let i = 0; i < 3 && !joke; i++) {
                try {
                    const res = await axios.get('https://icanhazdadjoke.com/', {
                        headers: { Accept: 'application/json' },
                        timeout: 5000
                    });

                    joke = res.data?.joke || null;
                } catch (e) {
                    console.warn(`[Blague] Attempt ${i + 1} failed:`, e.message);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (!joke) throw new Error('Could not fetch joke from API.');

            const jokeFr = await translateToFrench(joke);

            await kaya.sendMessage(
                from,
                { text: `🎉 *Here is a joke for you :*\n\n${jokeFr}` },
                { quoted: mek }
            );

        } catch (error) {
            console.error('❌ Error in blague.js:', error.message || error);

            await kaya.sendMessage(
                from,
                { text: '❌ Failed to fetch a joke. Try again later.' },
                { quoted: mek }
            );
        }
    }
};