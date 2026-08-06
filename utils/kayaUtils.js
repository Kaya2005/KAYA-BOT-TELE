// ==========================================
// FICHIER : ./utils/kayaUtils.js
// ==========================================
import { getSetting } from '../setting.js';

const messageCounter = new Map();

export const randomDelay = (min = 5000, max = 8000) => 
    new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

export async function sendLimited(kaya, originalSendMessage, jid, content, options = {}) {
    const number = jid.split('@')[0];
    const now = Date.now();
    
    // Récupérer le ownerId depuis l'instance de kaya
    const ownerId = kaya.user?.id ? kaya.user.id.split(':')[0] : '';
    
    // Récupérer le profil de vitesse choisi (par défaut '5-8')
    const speedProfile = getSetting(ownerId, 'botSpeed', '5-8');
    
    let min = 5000;
    let max = 8000;
    
    // Définition des plages horaires en millisecondes selon le profil
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
    
    // Si la limite d'envois est atteinte
    if (stats.count >= 100) {
        console.log(`[BAN PROTECTION] Limite atteinte pour ${number}. Pause de 60 secondes activée.`);
        try {
            // Signal à l'utilisateur de la pause anti-spam
            await originalSendMessage.call(kaya, jid, { 
                text: "🛡️ *[ANTI-SPAM PROTECTION]*\nLimite de messages atteinte. Le bot fait une pause de 60 secondes pour éviter un blocage par WhatsApp." 
            }, {});
        } catch (e) {}

        // Pause de 60 secondes
        await new Promise(resolve => setTimeout(resolve, 60000));
        
        // Réinitialisation partielle du compteur pour repartir prudemment
        stats.count = 50; 
        stats.lastReset = Date.now();
    }
    
    stats.count++;
    messageCounter.set(number, stats);
    
    // Appliquer le délai dynamique selon le choix
    await randomDelay(min, max); 
    
    try {
        return await originalSendMessage.call(kaya, jid, content, options);
    } catch (err) {
        // Interception des erreurs de rate limit (rate-overlimit / 429)
        if (String(err).includes('rate-overlimit') || String(err).includes('429')) {
            console.log(`[RATE LIMIT] Alerte rate-overlimit détectée pour ${number}. Pause de 60s...`);
            try {
                await originalSendMessage.call(kaya, jid, { 
                    text: "⚠️ *[RATE LIMIT DETECTED]*\nWhatsApp restreint temporairement les envois. Le bot applique une pause de sécurité de 60 secondes..." 
                }, {});
            } catch (e) {}
            
            // Pause de 60 secondes de refroidissement
            await new Promise(resolve => setTimeout(resolve, 60000));
            
            // Tentative de ré-envoi après la pause
            return await originalSendMessage.call(kaya, jid, content, options);
        }
        throw err;
    }
}
