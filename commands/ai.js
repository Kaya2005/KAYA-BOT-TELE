import fetch from 'node-fetch';
import { getSetting, setSetting } from '../setting.js';

export default {
    name: 'ai',
    description: '🤖 Ask a question to the artificial intelligence (Groq)',
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

            // 4. Handle key registration
            if (args[0] === 'setkey') {
                if (!isOwner) {
                    return await kaya.sendMessage(from, { 
                        text: `*❌ Only the owner of this bot can configure the API key.*` 
                    }, { quoted: mek });
                }

                const customKey = args[1];
                if (!customKey) {
                    return await kaya.sendMessage(from, { 
                        text: `*❌ Please provide your Groq API key.*\n\nExample: \`${prefix}ai setkey gsk_...\`` 
                    }, { quoted: mek });
                }
                
                await setSetting(botId, 'ai_api_key', customKey);
                return await kaya.sendMessage(from, { 
                    text: `*✅ Groq API key successfully registered for your bot!*` 
                }, { quoted: mek });
            }

            // 5. Handle key deletion
            if (args[0] === 'delkey') {
                if (!isOwner) {
                    return await kaya.sendMessage(from, { 
                        text: `*❌ Only the owner of this bot can delete this configuration.*` 
                    }, { quoted: mek });
                }

                await setSetting(botId, 'ai_api_key', null);
                return await kaya.sendMessage(from, { 
                    text: `*🗑️ Custom API key deleted.*` 
                }, { quoted: mek });
            }

            // 6. Check if the key is configured
            const ownerApiKey = getSetting(botId, 'ai_api_key', null);

            if (!ownerApiKey) {
                if (isOwner) {
                    const guideText = `*⚠️ Groq API Key Not Configured*\n\n` +
                        `As the owner, you must configure a free Groq API key to activate the assistant.\n\n` +
                        `🌐 *How to generate your free API key:*\n` +
                        `1. Go to [Groq Console](https://console.groq.com/)\n` +
                        `2. Log in (Google or GitHub account).\n` +
                        `3. Go to **API Keys** and create a new key (\`gsk_...\`).\n` +
                        `4. Copy the key.\n\n` +
                        `⚙️ *Save it in the bot using the command:*\n` +
                        `\`${prefix}ai setkey <your_key>\``;

                    return await kaya.sendMessage(from, { text: guideText }, { quoted: mek });
                } else {
                    return await kaya.sendMessage(from, { 
                        text: `*❌ The owner has not configured their AI API yet.*` 
                    }, { quoted: mek });
                }
            }

            const text = args.join(' ').trim();

            if (!text) {
                return await kaya.sendMessage(from, { 
                    text: `*❌ Incorrect usage.*\n\nExample: \`${prefix}ai What is Node.js?\`` 
                }, { quoted: mek });
            }

            // Use Groq API (Llama 3.3 Model)
            const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ownerApiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'user', content: text }
                    ]
                })
            });

            const json = await apiResponse.json();
            
            let answer = "";
            if (json.choices && json.choices[0]?.message?.content) {
                answer = json.choices[0].message.content;
            } else {
                answer = json.error?.message || "Sorry, an error occurred while communicating with the AI.";
            }

            await kaya.sendMessage(from, { text: answer }, { quoted: mek });

        } catch (err) {
            console.error('❌ Error in ai.js :', err);
            await kaya.sendMessage(from, { text: '⚠️ An error occurred while communicating with the artificial intelligence.' }, { quoted: mek });
        }
    }
};
