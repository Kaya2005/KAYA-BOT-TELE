import fs from 'fs';
import path from 'path';

export function startAutoCleanup() {
    const targetDir = process.cwd(); // Dossier racine du bot

    const clean = () => {
        try {
            const files = fs.readdirSync(targetDir);
            const now = Date.now();
            let deletedCount = 0;

            files.forEach(file => {
                // Cible les fichiers tmp_ ou les webp générés (out_)
                if (file.startsWith('tmp_') || (file.startsWith('out_') && file.endsWith('.webp'))) {
                    const filePath = path.join(targetDir, file);
                    try {
                        const stats = fs.statSync(filePath);
                        // Supprime le fichier s'il a plus de 15 minutes (pour éviter de couper un traitement en cours)
                        const fileAgeMinutes = (now - stats.mtimeMs) / (1000 * 60);
                        
                        if (fileAgeMinutes > 15) {
                            fs.unlinkSync(filePath);
                            deletedCount++;
                        }
                    } catch (err) {
                        // Ignore si le fichier est introuvable ou verrouillé par un processus actif
                    }
                }
            });

            if (deletedCount > 0) {
                console.log(`🧹 [CLEANUP] ${deletedCount} fichiers temporaires nettoyés.`);
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
