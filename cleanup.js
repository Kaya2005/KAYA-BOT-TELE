import fs from 'fs';
import path from 'path';

export function startAutoCleanup() {
    const targetDir = process.cwd(); 
    const PAIRING_DIR = path.join(targetDir, "richstore", "pairing");

    const clean = () => {
        try {
            const now = Date.now();
            let deletedCount = 0;

            // 1. Nettoyage des fichiers temporaires à la racine
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

            // 2. Nettoyage des fichiers de requêtes de pairage bloqués
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

            // 3. Nettoyage sécurisé des dossiers de sessions (en préservant creds.json)
            if (fs.existsSync(PAIRING_DIR)) {
                const sessionFolders = fs.readdirSync(PAIRING_DIR);
                
                sessionFolders.forEach(folder => {
                    if (folder.startsWith('request_') || folder.startsWith('pairing_') || folder.endsWith('.json')) {
                        return;
                    }

                    const sessionPath = path.join(PAIRING_DIR, folder);
                    
                    try {
                        if (fs.statSync(sessionPath).isDirectory()) {
                            const credsPath = path.join(sessionPath, "creds.json");
                            
                            // Suppression du dossier s'il est orphelin (sans creds.json depuis plus de 24h)
                            if (!fs.existsSync(credsPath)) {
                                const folderStats = fs.statSync(sessionPath);
                                if ((now - folderStats.mtimeMs) / (1000 * 60 * 60) > 24) {
                                    fs.rmSync(sessionPath, { recursive: true, force: true });
                                    deletedCount++;
                                    return;
                                }
                            }

                            // Nettoyage des vieux fichiers de cache internes de plus de 7 jours
                            const innerFiles = fs.readdirSync(sessionPath);
                            innerFiles.forEach(file => {
                                if (file === "creds.json" || file === "metadata.json") return;

                                const innerFilePath = path.join(sessionPath, file);
                                try {
                                    const innerStats = fs.statSync(innerFilePath);
                                    if ((now - innerStats.mtimeMs) / (1000 * 60 * 60 * 24) > 7) {
                                        fs.unlinkSync(innerFilePath);
                                        deletedCount++;
                                    }
                                } catch (e) {}
                            });
                        }
                    } catch (err) {}
                });
            }

            if (deletedCount > 0) {
                console.log(`🧹 [CLEANUP] ${deletedCount} fichiers ou éléments obsolètes purgés au démarrage.`);
            }

        } catch (err) {
            console.error('❌ Erreur lors du nettoyage au démarrage :', err);
        }
    };

    // Exécution immédiate au démarrage du serveur
    clean();
}
