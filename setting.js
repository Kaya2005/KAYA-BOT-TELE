import fs from "fs";
import path from "path";

// 🚀 CACHE EN MÉMOIRE
const cache = new Map();

/**
 * Génère le chemin du fichier de configuration.
 * Utilise path.resolve(process.cwd(), '..') pour sortir du dossier cloné (Kaya-MD)
 * et stocker les données à la racine du serveur.
 */
// Remplace la fonction getSettingsPath actuelle par celle-ci :
function getSettingsPath(jid) {
    const id = jid.split('@')[0];
    
    // On utilise simplement process.cwd() pour pointer vers la racine 
    // là où se trouve déjà ton dossier 'richstore'
    const rootDir = path.join(process.cwd(), "userall");
    const userDir = path.join(rootDir, id);
    
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }
    
    return path.join(userDir, "settings.json");
}


/**
 * Récupère un réglage (depuis le cache ou le disque)
 */
export function getSetting(jid, key, defaultValue = false) {
    if (!cache.has(jid)) {
        try {
            const filePath = getSettingsPath(jid);
            if (!fs.existsSync(filePath)) {
                cache.set(jid, {}); 
            } else {
                const data = JSON.parse(fs.readFileSync(filePath, "utf8") || "{}");
                cache.set(jid, data);
            }
        } catch (e) {
            console.error(`Failed to load settings for ${jid}`, e);
            return defaultValue;
        }
    }

    const settings = cache.get(jid);
    return settings[key] !== undefined ? settings[key] : defaultValue;
}

/**
 * Enregistre un réglage (met à jour le cache et écrit sur le disque)
 */
export function setSetting(jid, key, value) {
    try {
        if (!cache.has(jid)) {
            getSetting(jid, key);
        }

        const settings = cache.get(jid);
        settings[key] = value;
        
        const filePath = getSettingsPath(jid);
        fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error(`Failed to save settings for ${jid}`, e);
    }
}
