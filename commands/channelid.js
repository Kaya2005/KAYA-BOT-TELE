// channelid.js
import { getContextInfo } from '../setting/contextInfo.js';
import { usageBox, successBox, errorBox } from '../setting/theme.js';
import { getString } from '../setting/language.js';

export default {
  name: 'channelid',
  description: 'Get WhatsApp Channel ID from channel link',
  category: 'General',

  async execute(kaya, mek, from, args, prefix) {
    try {
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

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
            text: errorBox(getString(ownerId, 'channelIdInvalidLink')),
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
            text: errorBox(getString(ownerId, 'channelIdFetchError')),
            contextInfo: getContextInfo(mek.sender)
          },
          { quoted: mek }
        );
      }

      // ✅ Envoi du Channel ID
      const successContent = `${getString(ownerId, 'channelIdSuccessTitle')}\n\n\`${info.id}@newsletter\``;
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
      const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

      await kaya.sendMessage(
        from,
        {
          text: errorBox(`${getString(ownerId, 'channelIdGeneralError')} : ${err.message}`),
          contextInfo: getContextInfo(mek.sender)
        },
        { quoted: mek }
      );
    }
  }
};
