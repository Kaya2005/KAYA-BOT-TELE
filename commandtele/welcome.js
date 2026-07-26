// ==========================================
// FICHIER : commandtele/welcome.js
// ==========================================
export default function setupWelcome(bot) {
    bot.on('new_chat_members', async (ctx, next) => {
        try {
            console.log("[WELCOME] Événement déclenché pour le groupe :", ctx.chat?.title);
            
            const chatName = ctx.chat?.title || "ChatinGroup";
            const memberCount = await ctx.telegram.getChatMemberCount(ctx.chat.id).catch(() => "N/A");

            if (!ctx.message || !ctx.message.new_chat_members) {
                console.log("[WELCOME] Attention : ctx.message.new_chat_members est vide ou introuvable.");
                return next();
            }

            for (const member of ctx.message.new_chat_members) {
                // Ignorer si le bot lui-même rejoint
                if (ctx.botInfo && member.id === ctx.botInfo.id) {
                    console.log("[WELCOME] Le bot a rejoint lui-même, ignoré.");
                    continue;
                }

                // Récupération sécurisée du nom et du prénom
                const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ');
                const username = member.username ? `@${member.username}` : 'Aucun';
                const id = member.id;

                const welcomeText = `🥳 ʙɪᴇɴᴠᴇɴᴜᴇ ᴅᴀɴs ⟨ ${chatName}...\n\n` +
                                    `👤 ɴᴏᴍ : ${fullName}\n\n` +
                                    `🆔 ᴜsᴇʀɴᴀᴍᴇ : ${username}\n\n` +
                                    `🆔 ɪᴅ : ${id}\n\n` +
                                    `👥 ᴠᴏᴜs êᴛᴇs ʟᴇ ᴍᴇᴍʙʀᴇ ɴᴜᴍéʀᴏ ${memberCount}\n\n` +
                                    `⚠️ ᴍᴇʀᴄɪ ᴅᴇ ʀᴇsᴘᴇᴄᴛᴇʀ ʟᴇs ʀèɢʟᴇs.\n` +
                                    `ʟᴇs ʟɪᴇɴs ᴇᴛ ʟᴇs ᴀʙᴜs sᴏɴᴛ ɪɴᴛᴇʀᴅɪᴛs.\n\n` +
                                    `ʙᴏɴ séᴊᴏᴜʀ ❤️`;

                await ctx.reply(welcomeText);
                console.log(`[WELCOME] Message de bienvenue envoyé avec succès à ${fullName}`);
            }
            
            return next();
        } catch (err) {
            console.error("[WELCOME ERROR CRITICAL DETAILS] :", err.message);
            console.error(err); // Affiche la trace complète de l'erreur dans la console
            return next();
        }
    });
}
