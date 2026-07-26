// ==========================================
// FICHIER : commandtele/welcome.js
// ==========================================
export default function setupWelcome(bot) {
    bot.on('new_chat_members', async (ctx, next) => {
        try {
            const chatName = ctx.chat?.title || "ChatinGroup";

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

                // Style avec le cadre Telegram (blockquote >)
                const welcomeText = `> ▉ \`WELCOME\` ▉\n` +
                                    `> ▰▰▰▰▰▰▰▰▰▰\n` +
                                    `> \n` +
                                    `> 🥳 ʙɪᴇɴᴠᴇɴᴜᴇ ᴅᴀɴs ⟨ ${chatName}...\n` +
                                    `> \n` +
                                    `> 👤 ɴᴏᴍ : ${fullName}\n` +
                                    `> \n` +
                                    `> 🆔 ᴜsᴇʀɴᴀᴍᴇ : ${username}\n` +
                                    `> \n` +
                                    `> 🆔 ɪᴅ : ${id}\n` +
                                    `> \n` +
                                    `> ▰▰▰▰▰▰▰▰▰▰\n` +
                                    `> \n` +
                                    `> ⚠️ ᴍᴇʀᴄɪ ᴅᴇ ʀᴇsᴘᴇᴄᴛᴇʀ ʟᴇs ʀèɢʟᴇs.\n` +
                                    `> ʟᴇs ʟɪᴇɴs ᴇᴛ ʟᴇs ᴀʙᴜs sᴏɴᴛ ɪɴᴛᴇʀᴅɪᴛs.\n` +
                                    `> \n` +
                                    `> ʙᴏɴ séᴊᴏᴜʀ ❤️`;

                // Récupération de la photo de profil du membre
                let photoFileId = null;
                try {
                    const profilePhotos = await ctx.telegram.getUserProfilePhotos(member.id, { limit: 1 });
                    if (profilePhotos && profilePhotos.total_count > 0) {
                        const photos = profilePhotos.photos[0];
                        photoFileId = photos[photos.length - 1].file_id;
                    }
                } catch (e) {
                    console.error("Impossible de récupérer la photo de profil :", e);
                }

                // Envoi de la photo avec la légende et le parse_mode Markdown pour activer le cadre
                if (photoFileId) {
                    await ctx.replyWithPhoto(photoFileId, { 
                        caption: welcomeText, 
                        parse_mode: 'Markdown' 
                    });
                } else {
                    await ctx.reply(welcomeText, { 
                        parse_mode: 'Markdown' 
                    });
                }
            }
            
            return next();
        } catch (err) {
            console.error("[WELCOME ERROR CRITICAL]:", err);
            return next();
        }
    });
}
