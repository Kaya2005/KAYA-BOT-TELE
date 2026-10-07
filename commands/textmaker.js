// ==================== commands/textmaker.js ====================
import { sendWithBotImage } from '../setting/botAssets.js';
import { getContextInfo } from '../setting/contextInfo.js';

// List of available effects with their respective URLs
const effects = {
    glitch: {
        name: "Glitch Text Effect",
        url: "https://textpro.me/create-glitch-text-effect-style-tik-tok-983.html",
        inputs: 2,
        example: "Text1;Text2"
    },
    metallic: {
        name: "Metallic Text Effect",
        url: "https://textpro.me/create-a-metallic-text-effect-free-online-1041.html",
        inputs: 1,
        example: "MyText"
    },
    steel: {
        name: "Steel Text Effect",
        url: "https://en.ephoto360.com/steel-text-effect-66.html",
        inputs: 2,
        example: "Text1;Text2"
    },
    sed: {
        name: "Wet Glass Text Effect",
        url: "https://en.ephoto360.com/write-text-on-wet-glass-online-589.html",
        inputs: 1,
        example: "MyText"
    },
    burn: {
        name: "Burn Paper Text Effect",
        url: "https://photooxy.com/logo-and-text-effects/write-text-on-burn-paper-388.html",
        inputs: 1,
        example: "MyText"
    },
    bit8: {
        name: "8-Bit Arcade Text Effect",
        url: "https://photooxy.com/logo-and-text-effects/8-bit-text-on-arcade-rift-175.html",
        inputs: 2,
        example: "Text1;Text2"
    }
};

// Utility function to call the text generation API
async function callTextMakerAPI(effectUrl, text) {
    try {
        const apiResponse = await fetch(`https://api.vhtear.com/textpro?link=${encodeURIComponent(effectUrl)}&text=${encodeURIComponent(text)}`);
        const json = await apiResponse.json();
        
        if (json.status === 200 || json.result) {
            return { url: json.result || json.url };
        }
        return { url: null };
    } catch (e) {
        return { url: null };
    }
}

export default {
    name: 'textmaker',
    aliases: ['txtmaker', 'effect'],
    category: 'Maker',
    description: 'Generates various artistic text effects.',

    async execute(kaya, mek, from, args, prefix) {
        try {
            const effectKey = args[0]?.toLowerCase();

            // ==========================================
            // IF NO EFFECT IS SPECIFIED -> SHOW THE LIST
            // ==========================================
            if (!effectKey || !effects[effectKey]) {
                const effectListText = Object.keys(effects).map((key, idx) => {
                    const eff = effects[key];
                    return `*${idx + 1}.* \`${prefix}textmaker ${key}\`\n   ↳ _${eff.name}_ (Ex: ${prefix}textmaker ${key} ${eff.example})`;
                }).join('\n\n');

                const helpCaption = `
▉ \`TEXTMAKER PANEL\` ▉
▰▰▰▰▰▰▰▰▰▰
🎨 *Available text effects:*

${effectListText}

______________________
💡 *Usage:* \`${prefix}textmaker <effect> <text>\`
`.trim();

                return await sendWithBotImage(kaya, from, mek.sender, { 
                    caption: helpCaption, 
                    contextInfo: getContextInfo(mek.sender) 
                });
            }

            // Retrieve the remaining text after the effect key
            const textQuery = args.slice(1).join(' ').trim();
            const selectedEffect = effects[effectKey];

            if (!textQuery) {
                return await kaya.sendMessage(from, { 
                    text: `❌ Please provide text for the *${selectedEffect.name}* effect!\n\n💡 *Example:* \`${prefix}textmaker ${effectKey} ${selectedEffect.example}\`` 
                }, { quoted: mek });
            }

            // Loading message
            await kaya.sendMessage(from, { text: `⏳ Generating *${selectedEffect.name}* effect, please wait...` }, { quoted: mek });

            // Call generation API
            const result = await callTextMakerAPI(selectedEffect.url, textQuery);

            if (!result.url) {
                return await kaya.sendMessage(from, { text: '❌ An error occurred while communicating with the generation server.' }, { quoted: mek });
            }

            // Send the final image
            await kaya.sendMessage(from, { 
                image: { url: result.url }, 
                caption: `✨ *Effect:* ${selectedEffect.name}\n📝 *Text:* ${textQuery}`,
                contextInfo: getContextInfo(mek.sender)
            }, { quoted: mek });

        } catch (err) {
            console.error('❌ textmaker.js error:', err);
            await kaya.sendMessage(from, { text: '⚠️ A critical error occurred during execution.' }, { quoted: mek });
        }
    }
};
