// ==========================================
// FICHIER : commandtele/antilink.js
// ==========================================
export default function setupAntiLink(bot) {
    bot.on('message', async (ctx, next) => {
        try {
            // Si ce n'est pas un groupe ou supergroupe, on laisse passer au middleware suivant
            if (!ctx.chat || !['supergroup', 'group'].includes(ctx.chat.type)) {
                return next();
            }
            if (!ctx.message || !ctx.message.text) {
                return next();
            }

            const text = ctx.message.text;
            const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(t\.me\/[^\s]+)/gi;

            if (linkRegex.test(text)) {
                // 1. Vérifier si c'est un administrateur anonyme (envoyé au nom du groupe/canal)
                if (ctx.sender_chat && ctx.sender_chat.id === ctx.chat.id) {
                    return next(); 
                }

                // 2. Vérifier si l'utilisateur est un administrateur standard
                try {
                    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
                    if (['creator', 'administrator'].includes(member.status)) {
                        return next(); // Les admins ont le droit de poster des liens
                    }
                } catch (err) {
                    console.error("[ANTILINK] Erreur lors de la vérification de l'admin :", err);
                    // En cas d'erreur API, on laisse passer pour éviter de bloquer à tort
                    return next();
                }

                // --- POUR LES MEMBRES NORMAUX UNIQUEMENT ---

                // Supprimer le message contenant le lien
                await ctx.deleteMessage().catch(() => {});
                
                // Envoyer le message d'avertissement temporaire
                const warning = await ctx.reply(`⚠️ @${ctx.from.username || ctx.from.first_name}, les liens sont interdits ici !`);
                setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, warning.message_id).catch(() => {}), 4000);
                
                return; // On stoppe ici car le message illégal a été traité
            }

            // Si aucun lien n'est détecté, on laisse passer le message normalement
            return next();
            
        } catch (err) {
            console.error("[ANTILINK ERROR]", err);
            return next(); // En cas d'erreur globale, on évite de bloquer tout le bot
        }
    });
}
