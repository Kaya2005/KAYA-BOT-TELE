// ==========================================
// FICHIER : commandtele/welcome.js
// ==========================================
export default function setupWelcome(bot) {
    bot.on('new_chat_members', async (ctx, next) => {
        try {
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

                // Date et heure dynamiques
                const now = new Date();
                const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const date = now.toLocaleDateString('fr-FR');

                const welcomeText = `▰▰▰▰▰▰▰▰▰▰
➠ ᴜsᴇʀ : ${fullName}
➠ ᴛɪᴍᴇ : ${time}
➠ ᴅᴀᴛᴇ : ${date}

    🇼​🇪​🇱​🇨​🇴​🇲​🇪​ 
╭▰▰▰▰▰▰▰◈
┆❏ 🙋 ᴜsᴇʀɴᴀᴍᴇ : ${username}
┆❏ 🆔 ɪᴅ : ${id}
╰▰▰▰▰▰▰▰◈`;

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

                // Envoi de la photo avec la légende ou message texte simple
                if (photoFileId) {
                    await ctx.replyWithPhoto(photoFileId, { caption: welcomeText });
                } else {
                    await ctx.reply(welcomeText);
                }
            }
            
            return next();
        } catch (err) {
            console.error("[WELCOME ERROR CRITICAL]:", err);
            return next();
        }
    });
}
