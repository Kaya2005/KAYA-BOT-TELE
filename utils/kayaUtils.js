// ==========================================
// FILE: ./utils/kayaUtils.js
// ==========================================
import { getSetting } from '../setting.js';

const messageCounter = new Map();
// ✅ Global tracker to prevent warning message spam
let lastWarningTime = 0; 

export const randomDelay = (min = 5000, max = 8000) => 
    new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

export async function sendLimited(kaya, originalSendMessage, jid, content, options = {}) {
    const number = jid.split('@')[0];
    const now = Date.now();
    
    // Retrieve ownerId from the kaya instance
    const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
    
    // Retrieve the chosen speed profile (default '5-8')
    const speedProfile = getSetting(ownerId, 'botSpeed', '5-8');
    
    let min = 5000;
    let max = 8000;
    
    // Define time ranges in milliseconds based on the profile
    switch (speedProfile) {
        case '1-2': min = 1000; max = 2000; break;
        case '2-3': min = 2000; max = 3000; break;
        case '3-4': min = 3000; max = 4000; break;
        case '4-6': min = 4000; max = 6000; break;
        case '5-8': min = 5000; max = 8000; break;
        case '6-10': min = 6000; max = 10000; break;
        case '8-10': min = 8000; max = 10000; break;
        case '10-15': min = 10000; max = 15000; break;
        default: min = 5000; max = 8000; break;
    }

    const stats = messageCounter.get(number) || { count: 0, lastReset: now };
    
    if (now - stats.lastReset > 3600000) {
        stats.count = 0;
        stats.lastReset = now;
    }
    
    // If send limit is reached
    if (stats.count >= 100) {
        console.log(`[BAN PROTECTION] Limit reached for ${number}. 60-second pause activated.`);
        
        // Anti-flood check for warning
        if (Date.now() - lastWarningTime > 60000) {
            lastWarningTime = Date.now();
            try {
                await originalSendMessage.call(kaya, jid, { 
                    text: "🛡️ *[ANTI-SPAM PROTECTION]*\nMessage limit reached. The bot is taking a 60-second pause to avoid being blocked by WhatsApp." 
                }, {});
            } catch (e) {}
        }

        // 60-second pause
        await new Promise(resolve => setTimeout(resolve, 60000));
        
        // Partial counter reset
        stats.count = 50; 
        stats.lastReset = Date.now();
    }
    
    stats.count++;
    messageCounter.set(number, stats);
    
    // Apply dynamic delay
    await randomDelay(min, max); 
    
    try {
        return await originalSendMessage.call(kaya, jid, content, options);
    } catch (err) {
        // Intercept rate limit errors (rate-overlimit / 429)
        if (String(err).includes('rate-overlimit') || String(err).includes('429')) {
            console.log(`[RATE LIMIT] Rate-overlimit alert detected for ${number}. 60s pause...`);
            
            // Anti-flood check for warning
            if (Date.now() - lastWarningTime > 60000) {
                lastWarningTime = Date.now();
                try {
                    await originalSendMessage.call(kaya, jid, { 
                        text: "⚠️ *[RATE LIMIT DETECTED]*\nWhatsApp is temporarily restricting sending. The bot is applying a 60-second safety pause..." 
                    }, {});
                } catch (e) {}
            }
            
            // 60-second cooldown pause
            await new Promise(resolve => setTimeout(resolve, 60000));
            
            // Retry sending after pause
            return await originalSendMessage.call(kaya, jid, content, options);
        }
        throw err;
    }
}
