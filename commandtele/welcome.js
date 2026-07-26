// ==========================================
// FICHIER : commandtele/welcome.js
// ==========================================
export default function setupWelcome(bot) {
    bot.on('new_chat_members', async (ctx, next) => {
        try {
            const chatName = ctx.chat.title || "ChatinGroup";
            
            // Correction : getChatMemberCount au singulier
            const memberCount = await ctx.telegram.getChatMemberCount(ctx.chat.id).catch(() => "N/A");

            for (const member of ctx.message.new_chat_members) {
                // Ignorer si le bot lui-même rejoint
                if (member.id === ctx.botInfo?.id) continue;

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
            console.error("[WELCOME ERROR]", err);
            return next();
        }
    });
}
