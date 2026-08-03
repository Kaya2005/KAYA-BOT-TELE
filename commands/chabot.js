import fetch from 'node-fetch';
import { getSetting, setSetting } from '../setting.js';
import { getBotName, sendWithBotImage } from '../setting.js';

export default {
    name: 'chatbot',
    description: '🤖 Active or deactivates the intelligent chatbot mode (natural teen)',
    category: 'AI',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const botId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            const senderJid = mek.sender || mek.key.participant || mek.key.remoteJid || '';
            const senderId = senderJid.split(':')[0].replace(/[^0-9]/g, '');
            const isOwner = senderId === botId;
            const isGroup = from.endsWith('@g.us');
            const groupId = isGroup ? from.split('@')[0] : null;
            const botName = getBotName(botId);

            if (!isOwner) {
                return await sendWithBotImage(kaya, from, botId, { text: `❌ Only the bot owner can configure this option.` }, { quoted: mek });
            }

            const option = args[0]?.toLowerCase();
            const targetScope = args[1]?.toLowerCase(); // all, private, off, etc.

            if (!['on', 'off', 'group'].includes(option)) {
                const usageText = `*🤖 ${botName} - CHATBOT CONFIGURATION*\n\n` +
                          `Usage:\n` +
                          `• \`${prefix}chatbot on all\` (Enable everywhere - private & groups)\n` +
                          `• \`${prefix}chatbot on private\` (Enable only in private chats)\n` +
                          `• \`${prefix}chatbot group all\` (Enable in ALL groups)\n` +
                          `• \`${prefix}chatbot group\` (Enable in this specific group only)\n` +
                          `• \`${prefix}chatbot group off\` (Disable in this specific group)\n` +
                          `• \`${prefix}chatbot off\` (Disable completely)\n\n` +
                          `*Note:* Requires a Groq API key registered via \`${prefix}ai setkey\` if not already done.`;

                return await sendWithBotImage(kaya, from, botId, { caption: usageText }, { quoted: mek });
            }

            if (option === 'off') {
                await setSetting(botId, 'chatbot_mode', 'off');
                return await sendWithBotImage(kaya, from, botId, { caption: `🗑️ ${botName} Chatbot completely disabled.` }, { quoted: mek });
            }

            if (option === 'on') {
                // Check if API key is configured
                const ownerApiKey = getSetting(botId, 'ai_api_key', null);

                if (!ownerApiKey) {
                    if (isOwner) {
                        const guideText = `*⚠️ Groq API Key Not Configured*\n\n` +
                            `As the owner, you must configure a free Groq API key to activate ${botName}'s assistant.\n\n` +
                            `🌐 *How to generate your free API key:*\n` +
                            `1. Go to [Groq Console](https://console.groq.com/)\n` +
                            `2. Log in (Google or GitHub account).\n` +
                            `3. Go to **API Keys** and create a new key (\`gsk_...\`).\n` +
                            `4. Copy the key.\n\n` +
                            `⚙️ *Save it in the bot using the command:*\n` +
                            `\`${prefix}ai setkey <your_key>\``;

                        return await sendWithBotImage(kaya, from, botId, { caption: guideText }, { quoted: mek });
                    }
                }

                if (targetScope === 'all') {
                    await setSetting(botId, 'chatbot_mode', 'all');
                    return await sendWithBotImage(kaya, from, botId, { caption: `✅ ${botName} Chatbot enabled **EVERYWHERE** (private chats and all groups).` }, { quoted: mek });
                } else if (targetScope === 'private' || targetScope === 'prive') {
                    await setSetting(botId, 'chatbot_mode', 'private');
                    return await sendWithBotImage(kaya, from, botId, { caption: `✅ ${botName} Chatbot enabled **IN PRIVATE CHATS ONLY**.` }, { quoted: mek });
                } else {
                    return await sendWithBotImage(kaya, from, botId, { caption: `❌ Specify where: \`${prefix}chatbot on all\` or \`private\`.` }, { quoted: mek });
                }
            }

            if (option === 'group') {
                if (targetScope === 'all') {
                    await setSetting(botId, 'chatbot_mode', 'all_groups');
                    return await sendWithBotImage(kaya, from, botId, { caption: `✅ ${botName} Chatbot enabled in **ALL GROUPS**.` }, { quoted: mek });
                }

                // For specific group actions, must be inside a group
                if (!isGroup) {
                    return await sendWithBotImage(kaya, from, botId, { caption: `❌ This subcommand must be used inside a group (or use \`${prefix}chatbot group all\`).` }, { quoted: mek });
                }

                const subAction = targetScope === 'off' ? 'off' : 'on';
                if (subAction === 'on') {
                    await setSetting(botId, 'chatbot_group_' + groupId, true);
                    await setSetting(botId, 'chatbot_mode', 'group');
                    return await sendWithBotImage(kaya, from, botId, { caption: `✅ ${botName} Chatbot enabled for **this specific group only**.` }, { quoted: mek });
                } else {
                    await setSetting(botId, 'chatbot_group_' + groupId, false);
                    return await sendWithBotImage(kaya, from, botId, { caption: `❌ ${botName} Chatbot disabled for **this specific group**.` }, { quoted: mek });
                }
            }

        } catch (err) {
            console.error('Chatbot.js error:', err);
            const botId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            await sendWithBotImage(kaya, from, botId, { caption: `⚠️ An error occurred.` }, { quoted: mek });
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
                // Private chat
                if (mode === 'private' || mode === 'all') {
                    // Allowed
                } else {
                    return; // Ignored if mode is group-only or all_groups
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
                            content: 'You are a teenager (a normal teen on WhatsApp). You reply to messages in a very casual, natural way, sometimes using common slang, text abbreviations, a bit of humor, without unnecessary capital letters, and ABOVE ALL, NEVER acting like a polite AI or a virtual assistant. Keep your sentences short, direct, and lively. IMPORTANT: Always reply in the exact same language as the user\'s message while keeping this exact teen personality.' 
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
