// ==================== commands/ping.js ====================

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

export default {
    name: 'ping',

    async execute(nexus, mek, from, args, prefix) {
        try {
            const start = Date.now();
            const latency = Date.now() - start;
            const uptime = formatUptime(process.uptime());

            const message = `🏓 *PONG*
            
*Latency:* ${latency}ms
*Uptime:* ${uptime}`;

            await nexus.sendMessage(
                from,
                { text: message },
                { quoted: mek }
            );

        } catch (err) {
            console.error('❌ Erreur dans ping.js :', err);

            await nexus.sendMessage(
                from,
                { text: '⚠️ Impossible de vérifier la latence.' },
                { quoted: mek }
            );
        }
    }
};
