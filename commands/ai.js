// ==================== commands/ai.js ====================
import fetch from 'node-fetch';
import { getSetting, setSetting } from '../setting.js';
import { boxMessage, errorBox, successBox, usageBox } from '../setting/theme.js';
import { getString } from '../setting/language.js'; // 🌐 Import de la gestion des langues

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
                        text: errorBox(getString(botId, 'aiOnlyOwnerConfig')) 
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
                    text: successBox(getString(botId, 'aiKeySuccess')) 
                }, { quoted: mek });
            }

            // 5. Handle key deletion
            if (args[0] === 'delkey') {
                if (!isOwner) {
                    return await kaya.sendMessage(from, { 
                        text: errorBox(getString(botId, 'aiOnlyOwnerDelete')) 
                    }, { quoted: mek });
                }

                await setSetting(botId, 'ai_api_key', null);
                return await kaya.sendMessage(from, { 
                    text: boxMessage('success', getString(botId, 'aiKeyDeleted'), '🗑️') 
                }, { quoted: mek });
            }

            // 6. Check if the key is configured
            const ownerApiKey = getSetting(botId, 'ai_api_key', null);

            if (!ownerApiKey) {
                if (isOwner) {
                    const guideContent = 
                        `${getString(botId, 'aiGuideLine1')}\n` +
                        `${getString(botId, 'aiGuideLine2')}\n\n` +
                        `• 1. ${getString(botId, 'aiGuideStep1')}\n` +
                        `• 2. ${getString(botId, 'aiGuideStep2')}\n` +
                        `• 3. ${getString(botId, 'aiGuideStep3')} :\n` +
                        `  \`${prefix}ai setkey <your_key>\``;

                    return await kaya.sendMessage(from, { 
                        text: boxMessage(getString(botId, 'aiKeyMissingTitle'), guideContent, '⚠️') 
                    }, { quoted: mek });
                } else {
                    return await kaya.sendMessage(from, { 
                        text: errorBox(getString(botId, 'aiOwnerNotConfigured')) 
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
                    model: 'openrouter/free',
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
                answer = json.error?.message || getString(botId, 'aiCommunicationError');
            }

            await kaya.sendMessage(from, { text: answer }, { quoted: mek });

        } catch (err) {
            console.error('❌ Error in ai.js :', err);
            const botId = kaya.user?.id ? kaya.user.id.split(':')[0].replace(/[^0-9]/g, '') : '';
            await kaya.sendMessage(from, { 
                text: errorBox(getString(botId, 'aiUnableToCommunicate')) 
            }, { quoted: mek });
        }
    }
};
