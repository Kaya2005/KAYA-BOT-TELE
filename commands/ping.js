// ==================== commands/ping.js ====================

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
            
            // Envoi d'un message temporaire ou calcul direct de la latence
            const latency = Date.now() - start;
            const uptime = formatUptime(process.uptime());

            const message = 
                `╭─── 🏓 *ᴘᴏɴɢ* ───╮\n` +
                `│\n` +
                `│  *ʟᴀᴛᴇɴᴄʏ :* ${latency}ᴍs\n` +
                `│  *ᴜᴘᴛɪᴍᴇ :* ${uptime}\n` +
                `│\n` +
                `╰──────────────────╯`;

            await kaya.sendMessage(
                from,
                { text: message },
                { quoted: mek }
            );

        } catch (err) {
            console.error('❌ Erreur dans ping.js :', err);

            await kaya.sendMessage(
                from,
                { text: '╭─── ⚠️ *ᴇʀʀᴏʀ* ───╮\n│\n│  ᴜɴᴀʙʟᴇ ᴛᴏ ᴄʜᴇᴄᴋ ʟᴀᴛᴇɴᴄʏ.\n│\n╰──────────────────╯' },
                { quoted: mek }
            );
        }
    }
};
