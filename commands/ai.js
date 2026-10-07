// ==================== commands/ai.js ====================
import fetch from 'node-fetch';
import { getSetting, setSetting } from '../setting.js';
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';

export default {
    name: 'ai',
    description: '🤖 Ask a question to the artificial intelligence (OpenRouter)',
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
                        text: errorBox('ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴄᴏɴғɪɢᴜʀᴇ ᴛʜᴇ ᴀᴘɪ ᴋᴇʏ.') 
                    }, { quoted: mek });
                }

                const customKey = args[1];
                if (!customKey) {
                    return await kaya.sendMessage(from, { 
                        text: usageBox(prefix, 'ai', 'setkey sk-or-v1-...') 
                    }, { quoted: mek });
                }
                
                await setSetting(botId, 'ai_api_key', customKey);
                return await kaya.sendMessage(from, { 
                    text: successBox('ᴏᴘᴇɴʀᴏᴜᴛᴇʀ ᴀᴘɪ ᴋᴇʏ sᴜᴄᴄᴇssғᴜʟʟʏ ʀᴇɢɪsᴛᴇʀᴇᴅ !') 
                }, { quoted: mek });
            }

            // 5. Handle key deletion
            if (args[0] === 'delkey') {
                if (!isOwner) {
                    return await kaya.sendMessage(from, { 
                        text: errorBox('ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴅᴇʟᴇᴛᴇ ᴛʜɪs ᴄᴏɴғɪɢᴜʀᴀᴛɪᴏɴ.') 
                    }, { quoted: mek });
                }

                await setSetting(botId, 'ai_api_key', null);
                return await kaya.sendMessage(from, { 
                    text: boxMessage('success', 'ᴄᴜsᴛᴏᴍ ᴀᴘɪ ᴋᴇʏ ᴅᴇʟᴇᴛᴇᴅ.', '🗑️') 
                }, { quoted: mek });
            }

            // 6. Check if the key is configured
            const ownerApiKey = getSetting(botId, 'ai_api_key', null);

            if (!ownerApiKey) {
                if (isOwner) {
                    const guideContent = 
                        `ᴀs ᴛʜᴇ ᴏᴡɴᴇʀ, ʏᴏᴜ ᴍᴜsᴛ ᴄᴏɴғɪɢᴜʀᴇ\n` +
                        `ᴀ ғʀᴇᴇ ᴏᴘᴇɴʀᴏᴜᴛᴇʀ ᴀᴘɪ ᴋᴇʏ.\n\n` +
                        `• 1. ɢᴏ ᴛᴏ openrouter.ai\n` +
                        `• 2. ᴄʀᴇᴀᴛᴇ ᴀ ɴᴇᴡ ᴀᴘɪ ᴋᴇʏ\n` +
                        `• 3. sᴀᴠᴇ ɪᴛ ᴜsɪɴɢ :\n` +
                        `  \`${prefix}ai setkey <your_key>\``;

                    return await kaya.sendMessage(from, { 
                        text: boxMessage('ᴀᴘɪ ᴋᴇʏ ᴍɪssɪɴɢ', guideContent, '⚠️') 
                    }, { quoted: mek });
                } else {
                    return await kaya.sendMessage(from, { 
                        text: errorBox('ᴛʜᴇ ᴏᴡɴᴇʀ ʜᴀs ɴᴏᴛ ᴄᴏɴғɪɢᴜʀᴇᴅ ᴛʜᴇɪʀ ᴀɪ ᴀᴘɪ ʏᴇᴛ.') 
                    }, { quoted: mek });
                }
            }

            const text = args.join(' ').trim();

            if (!text) {
                return await kaya.sendMessage(from, { 
                    text: usageBox(prefix, 'ai', 'What is Node.js?') 
                }, { quoted: mek });
            }

            // Use OpenRouter API with automatic free routing
            const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ownerApiKey}`,
                    'HTTP-Referer': 'https://github.com/kaya-bot',
                    'X-Title': 'KAYA BOT'
                },
                body: JSON.stringify({
                    model: 'openrouter/free', // Route automatiquement vers le meilleur modèle gratuit disponible
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
            await kaya.sendMessage(from, { 
                text: errorBox('ᴜɴᴀʙʟᴇ ᴛᴏ ᴄᴏᴍᴍᴜɴɪᴄᴀᴛᴇ ᴡɪᴛʜ ᴛʜᴇ ᴀɪ.') 
            }, { quoted: mek });
        }
    }
};
