export default {
  name: "gpstatus",
  alias: ["gpsetup", "groupstatus"],
  description: "Poste un statut lié à un groupe pour afficher le cercle vert sur sa photo",
  category: "General",

  async execute(kaya, mek, from, { args }) {
    try {
      const textArgs = args ? args.join(" ") : "";
      
      // Extraction du lien d'invitation WhatsApp
      const matchLink = textArgs.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/);

      if (!matchLink) {
        return kaya.sendMessage(
          from,
          { 
            text: `❌ Veuillez inclure le lien du groupe.\n\n*Exemple :*\n\`.gpstatus opening soon join 👇 chat.whatsapp.com/GGAOUkojdPh...\`` 
          },
          { quoted: mek }
        );
      }

      const inviteCode = matchLink[1];

      await kaya.sendMessage(from, { text: `⏳ Analyse du groupe et publication du statut...` }, { quoted: mek });

      // Récupération des informations officielles du groupe via son lien
      let groupInfo;
      try {
        groupInfo = await kaya.groupGetInviteInfo(inviteCode);
      } catch (e) {
        return kaya.sendMessage(
          from,
          { text: `❌ Impossible de récupérer les informations du groupe. Le lien est invalide ou expiré.` },
          { quoted: mek }
        );
      }

      // Récupération de la photo de profil du groupe
      let ppUrl = "https://i.ibb.co/2539hQZ/default-group.png";
      try {
        ppUrl = await kaya.profilePictureUrl(groupInfo.id, "image");
      } catch {}

      // Texte complet du statut (ce que tu tapes après la commande)
      const statusText = textArgs;

      // Publication du statut avec liaison directe au groupe (génère le cercle vert sur la photo du groupe)
      await kaya.sendMessage(
        "status@broadcast",
        {
          image: { url: ppUrl },
          caption: statusText
        },
        {
          groupJid: groupInfo.id // C'est cette option qui lie le statut au groupe
        }
      );

      // Confirmation dans le chat
      await kaya.sendMessage(
        from,
        { text: `✅ *Succès !* Le statut a été publié et le cercle vert est désormais actif sur la photo du groupe *${groupInfo.subject}*.` },
        { quoted: mek }
      );

    } catch (e) {
      console.error("GPSTATUS ERROR:", e);
      await kaya.sendMessage(
        from,
        { text: `❌ Erreur lors de la publication : ${e.message}` },
        { quoted: mek }
      );
    }
  },
};
