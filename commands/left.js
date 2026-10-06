// ================= commands/left.js =================

export default {
    name: 'left',
    description: '🚪 Bot leaves the group',
    category: 'Group',

    group: true,
    ownerOnly: true, // ✅ Corrigé ici pour correspondre au check de case.js

    run: async (kaya, mek, args) => {
        try {
            // mek.key.remoteJid contient l'ID du groupe (le "from")
            const from = mek.key.remoteJid;
            
            // 🚪 Quitter le groupe
            await kaya.sendMessage(from, { text: "👋 Bye bye, leaving this group." });
            await kaya.groupLeave(from);

        } catch (err) {
            console.error('❌ Left command error:', err);
        }
    }
};
