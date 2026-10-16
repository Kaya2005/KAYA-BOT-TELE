import fs from 'fs';
import path from 'path';

export function startAutoCleanup() {
    const targetDir = process.cwd();
    const PAIRING_DIR = path.join(targetDir, 'richstore', 'pairing');

    console.log('🧹 [CLEANUP] Service de nettoyage automatique activé en arrière-plan.');

    const runCleanup = () => {
        let deletedCount = 0;

        const removeFile = (filePath) => {
            try {
                if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            } catch (err) {
                console.error(`[CLEANUP] Impossible de supprimer ${filePath}:`, err.message);
            }
        };

        try {
            const now = Date.now();

            // 1. Supprimer les fichiers temporaires et stickers orphelins de plus de 10 minutes
            if (fs.existsSync(targetDir)) {
                for (const file of fs.readdirSync(targetDir)) {
                    if (
                        file.startsWith('tmp_') ||
                        (file.startsWith('out_') && file.endsWith('.webp'))
                    ) {
                        const filePath = path.join(targetDir, file);
                        try {
                            const stats = fs.statSync(filePath);
                            // Sécurité : ne supprime que si le fichier a plus de 10 min (évite de couper un envoi en cours)
                            if ((now - stats.mtimeMs) > 10 * 60 * 1000) {
                                removeFile(filePath);
                            }
                        } catch (e) {}
                    }
                }
            }

            // 2. Nettoyer les demandes de pairage de plus de 10 minutes
            if (fs.existsSync(PAIRING_DIR)) {
                for (const file of fs.readdirSync(PAIRING_DIR)) {
                    if (
                        file.startsWith('request_') ||
                        file.startsWith('pairing_')
                    ) {
                        const filePath = path.join(PAIRING_DIR, file);
                        try {
                            const stats = fs.statSync(filePath);
                            if ((now - stats.mtimeMs) > 10 * 60 * 1000) {
                                removeFile(filePath);
                            }
                        } catch (e) {}
                    }
                }

                // 3. Nettoyer uniquement les dossiers de sessions corrompus ou vides (sans creds.json)
                for (const folder of fs.readdirSync(PAIRING_DIR)) {
                    const sessionPath = path.join(PAIRING_DIR, folder);

                    try {
                        if (!fs.statSync(sessionPath).isDirectory()) continue;

                        const credsPath = path.join(sessionPath, 'creds.json');

                        if (!fs.existsSync(credsPath)) {
                            fs.rmSync(sessionPath, {
                                recursive: true,
                                force: true
                            });
                            deletedCount++;
                        }
                        // (L'étape 4 a été supprimée ici pour préserver vos sessions et éviter les bugs de messages)
                    } catch (err) {
                        console.error(
                            `[CLEANUP] Erreur sur ${folder}:`,
                            err.message
                        );
                    }
                }
            }

            if (deletedCount > 0) {
                console.log(
                    `🧹 [CLEANUP] Nettoyage automatique : ${deletedCount} éléments supprimés.`
                );
            }
        } catch (err) {
            console.error('[CLEANUP] Erreur générale :', err);
        }
    };

    // Lancer un premier nettoyage immédiat au démarrage
    runCleanup();

    // Répéter automatiquement le nettoyage toutes les 30 minutes
    setInterval(runCleanup, 30 * 60 * 1000);
}
