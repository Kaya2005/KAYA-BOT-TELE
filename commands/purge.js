export default {
  name: "purge",
  alias: ["kickall"],
  description: "Expulse tous les membres non-admin silencieusement",
  category: "Group",
  group: true,
  admin: true,
  botAdmin: true,

  async execute(kaya, mek, from, args, prefix) {
    try {
      // Récupération des metadata
      const groupMetadata = await kaya.groupMetadata(from);
      const botNumber = kaya.user.id.split(":")[0] + "@s.whatsapp.net";

      // Filtre : Tous sauf le bot et les admins
      const toKick = groupMetadata.participants
        .filter(p => !p.admin && p.id !== botNumber)
        .map(p => p.id);

      if (toKick.length === 0) return;

      // Expulsion silencieuse avec délai pour sécurité serveur
      for (const user of toKick) {
        await kaya.groupParticipantsUpdate(from, [user], "remove");
        await new Promise(r => setTimeout(r, 1000));
      }

      // Aucune notification envoyée pour garder le côté "silencieux"

    } catch (err) {
      console.error("❌ Erreur purge.js :", err);
      // Pas de message d'erreur dans le groupe pour rester discret
    }
  }
};
