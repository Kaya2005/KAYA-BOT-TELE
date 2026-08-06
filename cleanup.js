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

            // 1. Nettoyage des fichiers temporaires à la racine
            const files = fs.readdirSync(targetDir);
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

            // 2. Nettoyage des sessions WhatsApp (Garde uniquement creds.json et metadata.json)
            if (fs.existsSync(PAIRING_DIR)) {
                const folders = fs.readdirSync(PAIRING_DIR);
                let sessionFilesDeleted = 0;

                folders.forEach(folder => {
                    const sessionPath = path.join(PAIRING_DIR, folder);
                    try {
                        if (fs.lstatSync(sessionPath).isDirectory()) {
                            const sessionFiles = fs.readdirSync(sessionPath);
                            sessionFiles.forEach(file => {
                                // On supprime tout SAUF creds.json et metadata.json
                                if (file !== 'creds.json' && file !== 'metadata.json') {
                                    const filePath = path.join(sessionPath, file);
                                    if (fs.statSync(filePath).isFile()) {
                                        fs.unlinkSync(filePath);
                                        sessionFilesDeleted++;
                                    }
                                }
                            });
                        }
                    } catch (e) {
                        // Ignore si un fichier/dossier est verrouillé ou inaccessible
                    }
                });

                if (sessionFilesDeleted > 0) {
                    console.log(`🧹 [CLEANUP] Nettoyage des sessions : ${sessionFilesDeleted} fichiers inutiles purgés (creds.json et metadata.json préservés).`);
                }
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
