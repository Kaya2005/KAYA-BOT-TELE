export default {
  name: "purge",
  alias: ["speedkick"],
  description: "Expulse tous les membres non-admin en même temps",
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

      // Expulsion simultanée de tous les membres de la liste
      await kaya.groupParticipantsUpdate(from, toKick, "remove");

    } catch (err) {
      console.error("❌ Erreur purge.js :", err);
    }
  }
};
