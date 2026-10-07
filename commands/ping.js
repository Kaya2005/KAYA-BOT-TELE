// ==================== commands/ping.js ====================
import { boxMessage, errorBox, successBox } from '../setting/theme.js';

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}ʜ ${m}ᴍ ${s}s`;
}

export default {
    name: 'ping',
    category: 'General',
    description: 'Check bot latency and uptime',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const start = Date.now();
            
            // Calcul de la latence
            const latency = Date.now() - start;
            const uptime = formatUptime(process.uptime());

            const content = 
                `• *ʟᴀᴛᴇɴᴄʏ :* ${latency}ᴍs\n` +
                `• *ᴜᴘᴛɪᴍᴇ :* ${uptime}`;

            await kaya.sendMessage(
                from,
                { text: boxMessage('pong', content, '🏓') },
                { quoted: mek }
            );

        } catch (err) {
            console.error('❌ Erreur dans ping.js :', err);

            await kaya.sendMessage(
                from,
                { text: errorBox('ᴜɴᴀʙʟᴇ ᴛᴏ ᴄʜᴇᴄᴋ ʟᴀᴛᴇɴᴄʏ.') },
                { quoted: mek }
            );
        }
    }
};
