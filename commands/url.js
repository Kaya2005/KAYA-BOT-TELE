import { downloadMediaMessage } from "@whiskeysockets/baileys";
import FormData from "form-data";
import fetch from "node-fetch";

export default {
    name: "url",
    aliases: ["tourl", "catbox", "imgurl"],
    description: "Convertit une image répondue en lien URL public",
    category: "Tools",

    async execute(kaya, mek, from, args) {
        try {
            const quoted = mek.quoted;

            if (!quoted || !quoted.mtype || !quoted.mtype.includes("image")) {
                return await kaya.sendMessage(
                    from,
                    {
                        text: "❌ Veuillez répondre à une image avec la commande `.url` pour obtenir son lien."
                    },
                    { quoted: mek }
                );
            }

            const waitMsg = await kaya.sendMessage(
                from,
                {
                    text: "⏳ Téléchargement et upload de l'image en cours..."
                },
                { quoted: mek }
            );

            const buffer = await downloadMediaMessage(
                quoted,
                "buffer",
                {},
                {
                    logger: console,
                    reuploadRequest: kaya.updateMediaMessage
                }
            );

            if (!buffer) {
                return await kaya.sendMessage(
                    from,
                    {
                        text: "❌ Impossible de télécharger l'image.",
                        edit: waitMsg.key
                    }
                );
            }

            const formData = new FormData();
            formData.append("reqtype", "fileupload");
            formData.append("fileToUpload", buffer, {
                filename: "kaya_image.jpg"
            });

            const response = await fetch("https://catbox.moe/user/api.php", {
                method: "POST",
                body: formData,
                headers: formData.getHeaders()
            });

            const resultUrl = (await response.text()).trim();

            if (!resultUrl.startsWith("http")) {
                throw new Error("Réponse invalide de l'hébergeur.");
            }

            await kaya.sendMessage(
                from,
                {
                    text: `✅ **Lien généré avec succès !**\n\n🔗 ${resultUrl}`,
                    edit: waitMsg.key
                }
            );

        } catch (err) {
            console.error("Erreur lors de l'exécution de la commande url :", err);

            await kaya.sendMessage(
                from,
                {
                    text: `❌ Une erreur est survenue : ${err.message}`
                },
                { quoted: mek }
            );
        }
    },
};