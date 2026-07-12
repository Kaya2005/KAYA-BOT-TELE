import fs from "fs";
import path from "path";

// 🚀 CACHE EN MÉMOIRE
const cache = new Map();

/**
 * Génère le chemin du fichier de configuration :
 * Structure : /home/container/Kaya-MD/userall/ID_UTILISATEUR/user/settings.json
 */
function getSettingsPath(jid, createIfMissing = false) {
    // Nettoyage de l'ID pour ne garder que les chiffres (sécurisé)
    const id = jid.replace(/[^0-9]/g, '');
    
    // Chemin absolu : /home/container/Kaya-MD/userall/ID/user/
    const baseDir = path.join('/home/container/Kaya-MD', "userall", id, "user");
    
    if (createIfMissing && !fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }
    
    return path.join(baseDir, "settings.json");
}

/**
 * Récupère un réglage
 */
export function getSetting(jid, key, defaultValue = false) {
    // Si pas en cache, on charge depuis le disque
    if (!cache.has(jid)) {
        try {
            const filePath = getSettingsPath(jid, false);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, "utf8") || "{}");
                cache.set(jid, data);
            } else {
                cache.set(jid, {});
            }
        } catch (e) {
            console.error(`[SETTING] Erreur lecture ${jid}:`, e);
            return defaultValue;
        }
    }

    const settings = cache.get(jid);
    return settings && settings.hasOwnProperty(key) ? settings[key] : defaultValue;
}

/**
 * Enregistre un réglage
 */
export function setSetting(jid, key, value) {
    try {
        // S'assurer que le cache est initialisé
        if (!cache.has(jid)) {
            getSetting(jid, key);
        }

        const settings = cache.get(jid);
        settings[key] = value;
        
        // Mise à jour du cache
        cache.set(jid, settings);
        
        // Écriture sur le disque
        const filePath = getSettingsPath(jid, true); 
        fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error(`[SETTING] Erreur sauvegarde ${jid}:`, e);
    }
}
