// ==========================================
// FICHIER : commandtele/welcome.js (Version Debug)
// ==========================================
export default function setupWelcome(bot) {
    bot.on('new_chat_members', async (ctx, next) => {
        try {
            console.log("[WELCOME] Un événement de nouveau membre a été détecté !");
            
            const chatName = ctx.chat.title || "ChatinGroup";
            const memberCount = await ctx.telegram.getChatMemberCount(ctx.chat.id).catch(() => "N/A");

            for (const member of ctx.message.new_chat_members) {
                // Ignorer si le bot lui-même rejoint
                if (ctx.botInfo && member.id === ctx.botInfo.id) {
                    console.log("[WELCOME] Le bot lui-même a rejoint le groupe.");
                    continue;
                }

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
                console.log(`[WELCOME] Message de bienvenue envoyé pour ${fullName}`);
            }
            
            return next();
        } catch (err) {
            console.error("[WELCOME ERROR CRITICAL]:", err);
            return next();
        }
    });
}
