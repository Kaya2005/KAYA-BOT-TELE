// ================= commands/block.js =================

export default {
    name: 'block',
    category: 'Owner',
    description: 'Silently block the current user (Private chat only).',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const isGroup = from.endsWith('@g.us');

            // 🔐 Owner only (Private chat only)
            if (!mek.key.fromMe || isGroup) return;

            // 🔒 Direct, silent block
            await kaya.updateBlockStatus(from, 'block');

        } catch (err) {
            // silent fail
        }
    }
};