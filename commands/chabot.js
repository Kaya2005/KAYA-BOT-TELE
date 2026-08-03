import fetch from 'node-fetch';
import { getSetting, setSetting } from '../setting.js';
import { getContextInfo } from '../setting/contextInfo.js';
import { getBotName, sendWithBotImage } from '../setting/botAssets.js';

export default {
    name: 'chatbot',
    description: '🤖 Active or deactivates the intelligent chatbot mode (natural teen)',
    category: 'AI',

    async execute(kaya, mek, from, args, prefix) {
        try {
            // 1. Clean retrieval of the bot ID
            const botId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';

            // 2. Correct identification of the sender
            const senderJid = mek.sender || mek.key.participant || mek.key.remoteJid || '';
            const senderId = senderJid.split(':')[0].replace(/[^0-9]/g, '');

            // 3. Check if the sender is the owner
            const isOwner = senderId === botId;
            const isGroup = from.endsWith('@g.us');
            const groupId = isGroup ? from.split('@')[0] : null;
            const botName = getBotName(mek.sender);

            if (!isOwner) {
                return await sendWithBotImage(kaya, from, mek.sender, { text: `❌ Only the bot owner can configure this option.` }, { quoted: mek });
            }

            const option = args[0]?.toLowerCase();
            const targetScope = args[1]?.toLowerCase();

            // Handle setkey directly inside chatbot
            if (option === 'setkey') {
                const customKey = args[1];
                if (!customKey) {
                    const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*❌ Please provide your Groq API key.*\n\nExample: \`${prefix}chatbot setkey gsk_...\``;
                    return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
                }
                
                await setSetting(botId, 'ai_api_key', customKey);
                const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*✅ Groq API key successfully registered for ${botName}!*`;
                return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
            }

            // Handle delkey directly inside chatbot
            if (option === 'delkey') {
                await setSetting(botId, 'ai_api_key', null);
                const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*🗑️ Custom API key deleted.*`;
                return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
            }

            if (!['on', 'off', 'group'].includes(option)) {
                const usageText = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*🤖 CHATBOT CONFIGURATION*\n\n` +
                          `Usage:\n` +
                          `• \`${prefix}chatbot on all\` (Enable everywhere - private & groups)\n` +
                          `• \`${prefix}chatbot on private\` (Enable only in private chats)\n` +
                          `• \`${prefix}chatbot group all\` (Enable in ALL groups)\n` +
                          `• \`${prefix}chatbot group\` (Enable in this specific group only)\n` +
                          `• \`${prefix}chatbot group off\` (Disable in this specific group)\n` +
                          `• \`${prefix}chatbot off\` (Disable completely)\n` +
                          `• \`${prefix}chatbot setkey <key>\` (Configure Groq API key)\n` +
                          `• \`${prefix}chatbot delkey\` (Delete Groq API key)\n\n` +
                          `*Note:* Requires a Groq API key registered via \`${prefix}chatbot setkey\` if not already done.`;

                return await sendWithBotImage(kaya, from, mek.sender, { caption: usageText, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
            }

            if (option === 'off') {
                await setSetting(botId, 'chatbot_mode', 'off');
                const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*🗑️ Chatbot completely disabled.*`;
                return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
            }

            if (option === 'on') {
                const ownerApiKey = getSetting(botId, 'ai_api_key', null);

                if (!ownerApiKey) {
                    const guideText = `*⚠️ Groq API Key Not Configured*\n\n` +
                        `As the owner, you must configure a free Groq API key to activate ${botName}'s assistant.\n\n` +
                        `🌐 *How to generate your free API key:*\n` +
                        `1. Go to [Groq Console](https://console.groq.com/)\n` +
                        `2. Log in (Google or GitHub account).\n` +
                        `3. Go to **API Keys** and create a new key (\`gsk_...\`).\n` +
                        `4. Copy the key.\n\n` +
                        `⚙️ *Save it in the bot using the command:*\n` +
                        `\`${prefix}chatbot setkey <your_key>\``;

                    return await sendWithBotImage(kaya, from, mek.sender, { caption: guideText, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
                }

                if (targetScope === 'all') {
                    await setSetting(botId, 'chatbot_mode', 'all');
                    const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*✅ Chatbot enabled **EVERYWHERE** (private chats and all groups).*`;
                    return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
                } else if (targetScope === 'private' || targetScope === 'prive') {
                    await setSetting(botId, 'chatbot_mode', 'private');
                    const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*✅ Chatbot enabled **IN PRIVATE CHATS ONLY**.*`;
                    return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
                } else {
                    return await kaya.sendMessage(from, { text: `❌ Specify where: \`${prefix}chatbot on all\` or \`private\`.` }, { quoted: mek });
                }
            }

            if (option === 'group') {
                if (targetScope === 'all') {
                    await setSetting(botId, 'chatbot_mode', 'all_groups');
                    const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*✅ Chatbot enabled in **ALL GROUPS**.*`;
                    return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
                }

                if (!isGroup) {
                    return await kaya.sendMessage(from, { text: `❌ This subcommand must be used inside a group (or use \`${prefix}chatbot group all\`).` }, { quoted: mek });
                }

                const subAction = targetScope === 'off' ? 'off' : 'on';
                if (subAction === 'on') {
                    await setSetting(botId, 'chatbot_group_' + groupId, true);
                    await setSetting(botId, 'chatbot_mode', 'group');
                    const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*✅ Chatbot enabled for **this specific group only**.*`;
                    return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
                } else {
                    await setSetting(botId, 'chatbot_group_' + groupId, false);
                    const caption = `▉ \`${botName}\` ▉\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n*❌ Chatbot disabled for **this specific group**.*`;
                    return await sendWithBotImage(kaya, from, mek.sender, { caption, contextInfo: getContextInfo(mek.sender) }, { quoted: mek });
                }
            }

        } catch (err) {
            console.error('❌ Error in chatbot.js :', err);
            await kaya.sendMessage(from, { text: `⚠️ An error occurred.` }, { quoted: mek });
        }
    },

    // 🧠 Global listener function called by case.js
    async listen(kaya, mek, from, body, ownerId) {
        try {
            if (!body || typeof body !== 'string' || body.trim() === '') return;
            if (mek.key.fromMe) return;

            const isGroup = from.endsWith('@g.us');
            const groupId = isGroup ? from.split('@')[0] : null;
            const mode = getSetting(ownerId, 'chatbot_mode', 'off');

            if (mode === 'off') return;

            if (isGroup) {
                if (mode === 'private') return;
                if (mode === 'all_groups' || mode === 'all') {
                    // Allowed in all groups
                } else if (mode === 'group') {
                    const isGroupActive = getSetting(ownerId, 'chatbot_group_' + groupId, false);
                    if (!isGroupActive) return;
                } else {
                    return;
                }
            } else {
                if (mode === 'private' || mode === 'all') {
                    // Allowed
                } else {
                    return; 
                }
            }

            const ownerApiKey = getSetting(ownerId, 'ai_api_key', null);
            if (!ownerApiKey) return; 

            // Simulate typing presence
            await kaya.sendPresenceUpdate('composing', from).catch(() => {});

            const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ownerApiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are a teenager (a normal teen on WhatsApp). You reply to messages in a very casual, natural, and friendly way, sometimes using common slang, text abbreviations, a bit of humor, without unnecessary capital letters, and ABOVE ALL, NEVER acting like a polite AI or a virtual assistant. Keep your sentences short, direct, and lively. IMPORTANT: Always reply in the exact same language as the user\'s message while keeping this exact teen personality.' 
                        },
                        { role: 'user', content: body }
                    ],
                    temperature: 0.8
                })
            });

            const json = await apiResponse.json();
            let answer = json.choices?.[0]?.message?.content;

            if (answer) {
                await kaya.sendMessage(from, { text: answer }, { quoted: mek });
            }

        } catch (e) {
            console.error('Chatbot listener error:', e);
        }
    }
};
