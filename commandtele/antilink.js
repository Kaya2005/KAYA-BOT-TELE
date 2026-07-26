export default function setupAntiLink(bot) {
    bot.on('message', async (ctx) => {
        try {
            if (!ctx.chat || !['supergroup', 'group'].includes(ctx.chat.type)) return;
            if (!ctx.message || !ctx.message.text) return;

            const text = ctx.message.text;
            const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(t\.me\/[^\s]+)/gi;

            if (linkRegex.test(text)) {
                // Vérifier si l'utilisateur est admin
                const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
                if (['creator', 'administrator'].includes(member.status)) return;

                // Supprimer le message contenant le lien
                await ctx.deleteMessage().catch(() => {});
                
                const warning = await ctx.reply(`⚠️ @${ctx.from.username || ctx.from.first_name}, les liens sont interdits ici !`);
                setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, warning.message_id).catch(() => {}), 4000);
            }
        } catch (err) {
            console.error("[ANTILINK ERROR]", err);
        }
    });
}
