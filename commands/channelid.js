import { getContextInfo } from '../setting/contextInfo.js';

export default {
  name: 'channelid',
  description: 'Get WhatsApp Channel ID from channel link',
  category: 'General',

  async execute(kaya, mek, from, args, prefix) {
    try {
      // ❌ Vérification si un lien est fourni
      if (!args[0]) {
        return await kaya.sendMessage(
          from,
          {
            text: `❌ Usage:\n${prefix}channelid https://whatsapp.com/channel/XXXX`,
            contextInfo: getContextInfo()
          },
          { quoted: mek }
        );
      }

      // 🔎 Extraction du code d'invitation
      const match = args[0].match(/channel\/([A-Za-z0-9]+)/);
      if (!match) {
        return await kaya.sendMessage(
          from,
          {
            text: '❌ Invalid WhatsApp Channel link.',
            contextInfo: getContextInfo()
          },
          { quoted: mek }
        );
      }

      const inviteCode = match[1];

      // 📡 Récupération des métadonnées du canal (newsletter)
      const info = await kaya.newsletterMetadata('invite', inviteCode);

      if (!info?.id) {
        return await kaya.sendMessage(
          from,
          {
            text: '❌ Unable to fetch Channel ID.',
            contextInfo: getContextInfo()
          },
          { quoted: mek }
        );
      }

      // ✅ Envoi du Channel ID
      await kaya.sendMessage(
        from,
        {
          text: `✅ *WhatsApp Channel ID*\n\n\`${info.id}@newsletter\``,
          contextInfo: getContextInfo()
        },
        { quoted: mek }
      );

    } catch (err) {
      console.error('❌ CHANNELID ERROR:', err);

      await kaya.sendMessage(
        from,
        {
          text: '❌ Error while retrieving Channel ID.',
          contextInfo: getContextInfo()
        },
        { quoted: mek }
      );
    }
  }
};
