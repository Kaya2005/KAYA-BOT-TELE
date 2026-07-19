// utils/kayaUtils.js

const messageCounter = new Map();

// Délai humain (3 à 8 secondes)
export const randomDelay = (min = 3000, max = 8000) => 
    new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

// Gestionnaire de limite (100 messages/heure)
export async function sendLimited(kaya, originalSendMessage, jid, content, options = {}) {
    const number = jid.split('@')[0];
    const now = Date.now();
    
    // Récupérer le compteur ou créer un nouvel objet
    const stats = messageCounter.get(number) || { count: 0, lastReset: now };
    
    // Réinitialiser si plus d'une heure est passée
    if (now - stats.lastReset > 3600000) {
        stats.count = 0;
        stats.lastReset = now;
    }
    
    // Vérifier la limite
    if (stats.count >= 100) {
        console.log(`[BAN PROTECTION] Limite atteinte pour ${number}. Envoi bloqué.`);
        return null;
    }
    
    stats.count++;
    messageCounter.set(number, stats);
    
    // Appliquer un délai aléatoire avant chaque envoi (Anti-Ban majeur)
    await randomDelay(1000, 3000); 
    
    // Envoyer le message avec la fonction originale de Baileys
    return await originalSendMessage.call(kaya, jid, content, options);
}
