//setting.js
import fs from "fs";
import path from "path";

// 🚀 CACHE EN MÉMOIRE (La clé est "ownerId:groupId" ou juste "ownerId")
const cache = new Map();

/**
 * Génère le chemin du fichier de configuration.
 * Supporte la hiérarchie : userall/{ownerId}/{groupId}/settings.json
 */
function getSettingsPath(ownerId, groupId = null, createIfMissing = false) {
    // Nettoyage : les IDs sont nettoyés des caractères non numériques
    const cleanOwnerId = ownerId.replace(/[^0-9]/g, '');
    
    let baseDir;
    if (groupId) {
        // Chemin imbriqué pour les réglages de groupe : userall/{ownerId}/{groupId}/
        const cleanGroupId = groupId.replace(/[^0-9]/g, '');
        baseDir = path.join('/home/container/Kaya-MD', "userall", cleanOwnerId, cleanGroupId);
    } else {
        // Chemin racine pour les réglages personnels : userall/{ownerId}/
        baseDir = path.join('/home/container/Kaya-MD', "userall", cleanOwnerId);
    }
    
    if (createIfMissing && !fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }
    
    return path.join(baseDir, "settings.json");
}

/**
 * Récupère un réglage
 */
export function getSetting(ownerId, key, defaultValue = false, groupId = null) {
    const cacheKey = groupId ? `${ownerId}:${groupId}` : ownerId;
    
    if (!cache.has(cacheKey)) {
        try {
            const filePath = getSettingsPath(ownerId, groupId, false);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, "utf8") || "{}");
                cache.set(cacheKey, data);
            } else {
                cache.set(cacheKey, {});
            }
        } catch (e) {
            console.error(`[SETTING] Erreur lecture ${cacheKey}:`, e);
            return defaultValue;
        }
    }

    const settings = cache.get(cacheKey);
    return settings && settings.hasOwnProperty(key) ? settings[key] : defaultValue;
}

/**
 * Enregistre un réglage
 */
export function setSetting(ownerId, key, value, groupId = null) {
    try {
        const cacheKey = groupId ? `${ownerId}:${groupId}` : ownerId;
        
        // S'assurer que le cache est initialisé
        if (!cache.has(cacheKey)) {
            getSetting(ownerId, key, false, groupId);
        }

        const settings = cache.get(cacheKey);
        settings[key] = value;
        
        // Mise à jour du cache
        cache.set(cacheKey, settings);
        
        // Écriture sur le disque
        const filePath = getSettingsPath(ownerId, groupId, true); 
        fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error(`[SETTING] Erreur sauvegarde ${ownerId}:`, e);
    }
}
