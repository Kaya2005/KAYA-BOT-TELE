import fs from 'fs';
import path from 'path';

export function startAutoCleanup() {
    const targetDir = process.cwd(); 
    const PAIRING_DIR = path.join(targetDir, "richstore", "pairing");

    const clean = () => {
        try {
            const now = Date.now();
            let deletedCount = 0;

            // 1. Nettoyage rapide des fichiers temporaires à la racine (plus de 15 min)
            if (fs.existsSync(targetDir)) {
                const files = fs.readdirSync(targetDir);
                files.forEach(file => {
                    if (file.startsWith('tmp_') || (file.startsWith('out_') && file.endsWith('.webp'))) {
                        const filePath = path.join(targetDir, file);
                        try {
                            const stats = fs.statSync(filePath);
                            if ((now - stats.mtimeMs) / (1000 * 60) > 15) {
                                fs.unlinkSync(filePath);
                                deletedCount++;
                            }
                        } catch (err) {}
                    }
                });
            }

            // 2. Nettoyage uniquement des fichiers de requêtes de pairage bloqués (plus de 2 heures)
            if (fs.existsSync(PAIRING_DIR)) {
                const pairingFiles = fs.readdirSync(PAIRING_DIR);
                pairingFiles.forEach(file => {
                    if (file.startsWith('request_') || file.startsWith('pairing_')) {
                        const filePath = path.join(PAIRING_DIR, file);
                        try {
                            const stats = fs.statSync(filePath);
                            if ((now - stats.mtimeMs) / (1000 * 60 * 60) > 2) {
                                fs.unlinkSync(filePath);
                                deletedCount++;
                            }
                        } catch (e) {}
                    }
                });
            }

            if (deletedCount > 0) {
                console.log(`🧹 [CLEANUP] ${deletedCount} fichiers temporaires purgés.`);
            }

        } catch (err) {
            console.error('❌ Erreur lors du nettoyage automatique :', err);
        }
    };

    // Nettoyage léger au démarrage (sans bloquer le thread principal)
    setTimeout(clean, 5000);

    // Puis nettoyer toutes les 30 minutes automatiquement
    setInterval(clean, 30 * 60 * 1000);
}
