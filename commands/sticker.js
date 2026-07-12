export default {
    name: 'sticker',
    alias: ['s', 'stiker', 'stick'],
    description: 'Convert media to sticker',
    category: 'Tools',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const quoted = mek.msg?.contextInfo?.quotedMessage ? mek.msg : mek;
            const mime = (quoted.msg || quoted).mimetype || '';
            
            if (!/image|video|webp/.test(mime)) {
                return kaya.sendMessage(from, { text: `❌ Veuillez répondre à une image ou une vidéo pour créer un sticker.` });
            }

            const buffer = await kaya.downloadMediaMessage(quoted);

            await kaya.sendMessage(from, {
                sticker: buffer
            }, { quoted: mek });

        } catch (e) {
            console.error("STICKER ERROR :", e);
            kaya.sendMessage(from, { text: "❌ Échec lors de la création du sticker." });
        }
    }
};
