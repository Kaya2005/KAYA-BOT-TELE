// ==========================================
// FICHIER : commandtele/welcome.js
// ==========================================
export default function setupWelcome(bot) {
    bot.on('new_chat_members', async (ctx, next) => {
        try {
            const chatName = ctx.chat?.title || "ChatinGroup";
            
            // Récupération sécurisée du nombre de membres (compatible Telegraf)
            let memberCount = "N/A";
            try {
                if (typeof ctx.getChatMemberCount === 'function') {
                    memberCount = await ctx.getChatMemberCount();
                } else if (ctx.telegram && typeof ctx.telegram.getChatMemberCount === 'function') {
                    memberCount = await ctx.telegram.getChatMemberCount(ctx.chat.id);
                }
            } catch (e) {
                memberCount = "N/A";
            }

            if (!ctx.message || !ctx.message.new_chat_members) {
                return next();
            }

            for (const member of ctx.message.new_chat_members) {
                // Ignorer si le bot lui-même rejoint
                if (ctx.botInfo && member.id === ctx.botInfo.id) continue;

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
            }
            
            return next();
        } catch (err) {
            console.error("[WELCOME ERROR CRITICAL]:", err);
            return next();
        }
    });
}
