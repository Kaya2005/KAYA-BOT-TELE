import { getContextInfo } from '../setting/contextInfo.js';
import { usageBox, successBox, errorBox } from '../setting/theme.js';

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
            text: usageBox(prefix, 'channelid', 'https://whatsapp.com/channel/XXXX'),
            contextInfo: getContextInfo(mek.sender)
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
            text: errorBox('Invalid WhatsApp Channel link.'),
            contextInfo: getContextInfo(mek.sender)
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
            text: errorBox('Unable to fetch Channel ID.'),
            contextInfo: getContextInfo(mek.sender)
          },
          { quoted: mek }
        );
      }

      // ✅ Envoi du Channel ID
      const successContent = `WhatsApp Channel ID\n\n\`${info.id}@newsletter\``;
      await kaya.sendMessage(
        from,
        {
          text: successBox(successContent),
          contextInfo: getContextInfo(mek.sender)
        },
        { quoted: mek }
      );

    } catch (err) {
      console.error('❌ CHANNELID ERROR:', err);

      await kaya.sendMessage(
        from,
        {
          text: errorBox('Error while retrieving Channel ID.'),
          contextInfo: getContextInfo(mek.sender)
        },
        { quoted: mek }
      );
    }
  }
};
