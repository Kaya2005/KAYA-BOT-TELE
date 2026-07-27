import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import FormData from "form-data";

export default {
    name: "url",
    aliases: ["tourl", "catbox", "imgurl"],
    description: "Convertit une image répondue en lien URL public",
    category: "Tools",

    async execute(kaya, mek, from, args, prefix) {
        try {
            // Détection de l'image (réponse ou message direct)
            const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = mek.message?.imageMessage || quoted?.imageMessage;

            if (!imageMsg) {
                return kaya.sendMessage(
                    from,
                    {
                        text: `⚠️ *Usage :* Réponds à une image avec ${prefix}url`
                    },
                    { quoted: mek }
                );
            }

            await kaya.sendPresenceUpdate("composing", from);

            // Téléchargement de l'image
            const stream = await downloadContentFromMessage(imageMsg, "image");
            const chunks = [];

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            if (!buffer || buffer.length < 100) {
                return kaya.sendMessage(
                    from,
                    {
                        text: "❌ Impossible de télécharger cette image."
                    },
                    { quoted: mek }
                );
            }

            // Upload vers Catbox via form.submit (plus robuste sur les panels)
            const form = new FormData();
            form.append("reqtype", "fileupload");
            form.append("fileToUpload", buffer, {
                filename: "image.jpg",
                contentType: "image/jpeg"
            });

            const url = await new Promise((resolve, reject) => {
                form.submit("https://catbox.moe/user/api.php", (err, res) => {
                    if (err) return reject(err);
                    let rawData = "";
                    res.on("data", (chunk) => { rawData += chunk; });
                    res.on("end", () => {
                        resolve(rawData.trim());
                    });
                    res.on("error", (e) => { reject(e); });
                });
            });

            if (!url.startsWith("http")) {
                throw new Error(url || "Réponse invalide de Catbox");
            }

            await kaya.sendMessage(
                from,
                {
                    text: `✅ *Image uploadée avec succès !*\n\n🔗 ${url}`
                },
                { quoted: mek }
            );

        } catch (err) {
            console.error(err);

            await kaya.sendMessage(
                from,
                {
                    text: `❌ Une erreur est survenue : ${err.message}`
                },
                { quoted: mek }
            );
        }
    }
};
