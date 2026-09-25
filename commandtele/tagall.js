// ==========================================
// FILE : commandtele/tagall.js
// ==========================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const langFilePath = path.join(__dirname, '../database/languages.json');
const membersFilePath = path.join(__dirname, '../database/members.json');

function getLang(chatId) {
    try {
        if (fs.existsSync(langFilePath)) {
            const data = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
            return data[String(chatId)] || 'en';
        }
    } catch (e) {}
    return 'en';
}

function getGroupMembers(chatId) {
    try {
        if (fs.existsSync(membersFilePath)) {
            const data = JSON.parse(fs.readFileSync(membersFilePath, 'utf8'));
            return Object.values(data[String(chatId)] || {});
        }
    } catch (e) {
        console.error("[GET MEMBERS ERROR]:", e);
    }
    return [];
}

async function checkAdmin(ctx) {
    if (!ctx.chat || ctx.chat.type === 'private') return true;
    
    if (ctx.sender_chat || (ctx.from && ctx.from.id === 1087968824)) {
        return true;
    }

    try {
        const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
        return ['creator', 'administrator'].includes(member.status);
    } catch (err) {
        return false;
    }
}

export default function setupTagAll(bot) {
    const handleTagAll = async (ctx) => {
        try {
            if (!ctx.chat || !['supergroup', 'group'].includes(ctx.chat.type)) {
                return ctx.reply("<blockquote>This command can only be used in a group.</blockquote>", { 
                    parse_mode: 'HTML', 
                    reply_to_message_id: ctx.message?.message_id 
                });
            }

            const lng = getLang(ctx.chat.id);

            // Vérification des droits admin de l'utilisateur
            if (!(await checkAdmin(ctx))) {
                const errorMsg = lng === 'fr' 
                    ? "⚠️ Seuls les administrateurs peuvent utiliser la commande tagall." 
                    : "⚠️ Only administrators can use the tagall command.";
                return ctx.reply(`<blockquote>${errorMsg}</blockquote>`, { 
                    parse_mode: 'HTML', 
                    reply_to_message_id: ctx.message?.message_id 
                });
            }

            const args = ctx.message.text.split(' ').slice(1).join(' ');
            const customMessage = args.trim() 
                ? args 
                : (lng === 'fr' ? "🔔 Appel général !" : "🔔 General roll call!");

            // Récupération des membres enregistrés dans la base
            const members = getGroupMembers(ctx.chat.id);

            if (members.length === 0) {
                const noMembersMsg = lng === 'fr'
                    ? "⚠️ Aucun membre n'a encore été enregistré. Attendez que les membres envoient des messages dans le groupe."
                    : "⚠️ No members registered yet. Wait for members to send messages in the group.";
                return ctx.reply(`<blockquote>${noMembersMsg}</blockquote>`, { parse_mode: 'HTML' });
            }

            // Génération des mentions HTML pour chaque membre
            const mentions = members.map(m => `<a href="tg://user?id=${m.id}">${m.name}</a>`).join('\n');

            const senderMention = typeof ctx.userMention === 'function' 
                ? ctx.userMention() 
                : `<a href="tg://user?id=${ctx.from?.id}">${ctx.from?.first_name || "Admin"}</a>`;
            
            const text = `📢 <b>TAGALL</b>\n\n💬 ${customMessage}\n\n👥 <b>Membres :</b>\n${mentions}\n\n<i>Demandé par : ${senderMention}</i>`;

            await ctx.reply(text, {
                parse_mode: 'HTML',
                reply_to_message_id: ctx.message?.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '𝙺𝙰𝚈𝙰 𝙱𝙾𝚃 | 𝙲𝙰𝙽𝙰𝙻', url: 'https://t.me/kayatech2' }]
                    ]
                }
            });

            // Supprime le message de commande
            await ctx.deleteMessage().catch(() => {});

        } catch (err) {
            console.error("[TAGALL ERROR]:", err);
        }
    };

    bot.command('tagall', handleTagAll);
    bot.hears(/^tagall$/i, handleTagAll);
    bot.hears(/^\.tagall$/i, handleTagAll);
}
