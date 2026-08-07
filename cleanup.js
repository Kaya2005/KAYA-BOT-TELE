// ==================== cleanup.js ====================
import fs from 'fs';
import path from 'path';

export function startAutoCleanup() {
    const targetDir = process.cwd(); // Dossier racine du bot
    const PAIRING_DIR = path.join(targetDir, "richstore", "pairing");

    const clean = () => {
        try {
            const now = Date.now();
            let deletedCount = 0;

            // 1. Nettoyage sécurisé des fichiers temporaires à la racine (tmp_, webp générés)
            const files = fs.readdirSync(targetDir);
            files.forEach(file => {
                if (file.startsWith('tmp_') || (file.startsWith('out_') && file.endsWith('.webp'))) {
                    const filePath = path.join(targetDir, file);
                    try {
                        const stats = fs.statSync(filePath);
                        const fileAgeMinutes = (now - stats.mtimeMs) / (1000 * 60);
                        
                        // Supprime s'il a plus de 15 minutes
                        if (fileAgeMinutes > 15) {
                            fs.unlinkSync(filePath);
                            deletedCount++;
                        }
                    } catch (err) {}
                }
            });

            // 2. Nettoyage des fichiers de requêtes de pairage orphelins (sans toucher aux sessions Signal)
            if (fs.existsSync(PAIRING_DIR)) {
                const pairingFiles = fs.readdirSync(PAIRING_DIR);
                pairingFiles.forEach(file => {
                    if (file.startsWith('request_') || file.startsWith('pairing_')) {
                        const filePath = path.join(PAIRING_DIR, file);
                        try {
                            const stats = fs.statSync(filePath);
                            const fileAgeHours = (now - stats.mtimeMs) / (1000 * 60 * 60);
                            
                            // Supprime les fichiers de pairing bloqués de plus de 2 heures
                            if (fileAgeHours > 2) {
                                fs.unlinkSync(filePath);
                                deletedCount++;
                            }
                        } catch (e) {}
                    }
                });
            }

            if (deletedCount > 0) {
                console.log(`🧹 [CLEANUP] ${deletedCount} fichiers temporaires ou orphelins purgés.`);
            }

        } catch (err) {
            console.error('❌ Erreur lors du nettoyage automatique :', err);
        }
    };

    // Nettoyer au démarrage du bot
    clean();

    // Puis nettoyer toutes les 30 minutes automatiquement
    setInterval(clean, 30 * 60 * 1000);
}
