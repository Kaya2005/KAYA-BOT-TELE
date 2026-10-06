export default {
    name: "listadmin",
    description: "Display the list of group admins",
    category: "Group",
    group: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Récupérer les métadonnées du groupe
            const metadata = await kaya.groupMetadata(from);
            const participants = metadata.participants;

            // Filtrer les admins (admin et superadmin)
            const groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            
            // Créer la liste des mentions
            const adminMentions = groupAdmins.map(p => p.id);
            const listAdmin = groupAdmins
                .map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`)
                .join('\n▢ ');

            // Préparer le texte
            const text = `
▉ \`GROUP ADMINS\` ▉
▰▰▰▰▰▰▰▰▰▰▰▰▰
*Group:* ${metadata.subject}
*Total Admins:* ${groupAdmins.length}

┌─⊷ *ADMIN LIST*
▢ ${listAdmin}
└───────────
`.trim();

            // Envoyer le message avec mentions sans contextInfo
            return await kaya.sendMessage(
                from,
                { 
                    text: text, 
                    mentions: adminMentions
                },
                { quoted: mek }
            );

        } catch (err) {
            console.error("❌ listadmin command error:", err);
            return await kaya.sendMessage(
                from, 
                { text: "❌ Unable to retrieve the list of admins." }, 
                { quoted: mek }
            );
        }
    }
};
