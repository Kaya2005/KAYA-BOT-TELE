// ==========================================
// FILE: ./commands/lang.js
// COMMANDE DE CHANGEMENT DE LANGUE
// ==========================================

import { setLanguage, getString } from '../setting/language.js';
import { getSetting } from '../setting.js';
import { successBox, errorBox, boxMessage } from '../setting/theme.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
    name: 'lang',
    aliases: ['language', 'langue'],
    description: 'Change the bot language',
    category: 'System',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
            const currentLang = getSetting(ownerId, 'botLanguage', 'en');
            const newLang = args[0]?.toLowerCase();

            // Menu si aucun argument n'est fourni
            if (!newLang) {
                const menuText = 
                    `${getString(ownerId, 'currentLang')} \`${currentLang.toUpperCase()}\`\n\n` +
                    `• \`${prefix}lang fr\` (Français)\n` +
                    `• \`${prefix}lang en\` (English)\n` +
                    `• \`${prefix}lang wo\` (Wolof - Sénégal)\n` +
                    `• \`${prefix}lang ee\` (Ewe - Togo)\n` +
                    `• \`${prefix}lang ln\` (Lingala - RDC)\n` +
                    `• \`${prefix}lang sw\` (Swahili - Kenya/Tanzanie)\n` +
                    `• \`${prefix}lang zu\` (Zulu - Afrique du Sud)\n` +
                    `• \`${prefix}lang ht\` (Créole Haïtien - Haïti)\n` +
                    `• \`${prefix}lang hi\` (Hindi - Inde)`;

                return await kaya.sendMessage(
                    from, 
                    { 
                        text: boxMessage(getString(ownerId, 'langTitle'), menuText, '🌐'),
                        contextInfo: getContextInfo(mek.sender)
                    }, 
                    { quoted: mek }
                );
            }

            // Changement de la langue
            if (setLanguage(ownerId, newLang)) {
                // getString ira directement chercher la clé dans la nouvelle langue mise à jour
                const msg = `${getString(ownerId, 'langSuccess')} *${newLang.toUpperCase()}*`;
                return await kaya.sendMessage(
                    from, 
                    { 
                        text: successBox(msg),
                        contextInfo: getContextInfo(mek.sender)
                    }, 
                    { quoted: mek }
                );
            } else {
                return await kaya.sendMessage(
                    from, 
                    { 
                        text: errorBox(getString(ownerId, 'langInvalid')),
                        contextInfo: getContextInfo(mek.sender)
                    }, 
                    { quoted: mek }
                );
            }

        } catch (err) {
            console.error('❌ Error in lang.js:', err);
            await kaya.sendMessage(
                from, 
                { text: errorBox(`Error: ${err.message}`) }, 
                { quoted: mek }
            );
        }
    }
};
