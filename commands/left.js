// ================= commands/left.js =================

export default {
    name: 'left',
    description: '🚪 Bot leaves the group',
    category: 'Group',

    group: true,
    owner: true,

    run: async (kaya, m, args) => {
        try {
            // 🚪 Quit group
            await kaya.groupLeave(m.chat);

        } catch (err) {
            console.error('❌ Left command error:', err);
        }
    }
};