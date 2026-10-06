// commands/speed.js
import { getSetting, setSetting } from '../setting.js';

export default {
    name: 'speed',
    aliases: ['vitesse', 'botspeed'],
    description: 'Change the random response delay speed of the bot',
    category: 'System',
    ownerOnly: true,

    async execute(kaya, mek, from, args, prefix) {
        try {
            const ownerId = kaya.user.id.split(':')[0];
            const choice = args[0]?.toLowerCase();

            // Available speed presets with descriptive indicators
            const validSpeeds = {
                '1-2': '1 to 2 seconds ⚡ (Fastest)',
                '2-3': '2 to 3 seconds 🚀',
                '3-4': '3 to 4 seconds 🐇',
                '4-6': '4 to 6 seconds 🚶‍♂️',
                '5-8': '5 to 8 seconds (Recommended) 🛡️',
                '6-10': '6 to 10 seconds 🐢',
                '8-10': '8 to 10 seconds 🦥',
                '10-15': '10 to 15 seconds 🧊 (Safest)'
            };

            // If no valid choice is provided, display the interactive menu with instructions
            if (!choice || !validSpeeds[choice]) {
                const current = getSetting(ownerId, 'botSpeed', '5-8');
                let menuText = `⚙️ *BOT SPEED MANAGEMENT*\n\n`;
                menuText += `*Current Speed:* ${current}s\n\n`;
                menuText += `*Available Options:*\n`;
                
                for (const [key, desc] of Object.entries(validSpeeds)) {
                    menuText += `▪️ \`${prefix}speed ${key}\` (${desc})\n`;
                }

                menuText += `\n*How to use:* Type \`${prefix}speed <range>\` to update.\n`;
                menuText += `*Example:* \`${prefix}speed 5-8\``;

                return await kaya.sendMessage(from, { text: menuText }, { quoted: mek });
            }

            // Save the new global speed setting
            await setSetting(ownerId, 'botSpeed', choice);
            
            return await kaya.sendMessage(from, { 
                text: `✅ Response speed updated successfully!\n⏱️ New Range: *${validSpeeds[choice]}*` 
            }, { quoted: mek });

        } catch (err) {
            await kaya.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: mek });
        }
    }
};
