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
            // Vérifie si le message cite (répond à) un message contenant un média
            const quoted = mek.quoted ? mek.quoted : null;
            
            if (!quoted || !quoted.mtype || !quoted.mtype.includes("image")) {
                return await kaya.sendMessage(
                    from, 
                    { text: "❌ Veuillez répondre à une image avec la commande `.url` pour obtenir son lien." }, 
                    { quoted: mek }
                );
            }

            // Message d'attente
            const waitMsg = await kaya.sendMessage(
                from, 
                { text: "⏳ Téléchargement et upload de l'image en cours..." }, 
                { quoted: mek }
            );

            // Reconstruction de l'objet message pour le téléchargement Baileys
            const streamMessage = {
                key: {
                    remoteJid: mek.chat,
                    id: mek.msg.contextInfo.stanzaId,
                    participant: mek.msg.contextInfo.participant
                },
                message: mek.msg.contextInfo.quotedMessage
            };

            // Téléchargement du buffer de l'image
            const buffer = await downloadMediaMessage(streamMessage, "buffer", {}, { logger: console });

            if (!buffer) {
                return await kaya.sendMessage(
                    from, 
                    { text: "❌ Impossible de télécharger l'image.", edit: waitMsg.key }
                );
            }

            // Préparation de l'envoi vers l'API Catbox
            const formData = new FormData();
            formData.append("reqtype", "fileupload");
            formData.append("fileToUpload", buffer, { filename: "kaya_image.jpg" });

            const response = await fetch("https://catbox.moe/user/api.php", {
                method: "POST",
                body: formData,
                headers: formData.getHeaders ? formData.getHeaders() : {}
            });

            const resultUrl = await response.text();

            if (!resultUrl || !resultUrl.startsWith("http")) {
                throw new Error("Réponse invalide de l'hébergeur.");
            }

            // Envoi du résultat final avec le lien
            await kaya.sendMessage(
                from,
                { 
                    text: `✅ **Lien généré avec succès !**\n\n🔗 \`${resultUrl.trim()}\``,
                    edit: waitMsg.key 
                }
            );

        } catch (err) {
            console.error("Erreur lors de l'exécution de la commande url :", err);
            await kaya.sendMessage(
                from, 
                { text: `❌ Une erreur est survenue : ${err.message}` }, 
                { quoted: mek }
            );
        }
    },
};
