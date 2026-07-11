export default {
    name: 'update',
    alias: ['maj'],
    ownerOnly: true, // Très important : réservé à toi
    description: 'Met à jour le bot',
    async execute(kaya, mek, from, args) {
        await kaya.sendMessage(from, { text: '🔄 Mise à jour en cours... Le bot va redémarrer.' }, { quoted: mek });
        
        // On tue le processus actuel du bot. 
        // Le loader détectera l'arrêt (code de sortie 0) et relancera le bot.
        process.exit(0); 
    }
};
