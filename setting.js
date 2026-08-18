// setting.js
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";

// 🚀 CACHE EN MÉMOIRE
const cache = new Map();

/**
 * Extrait un ID numérique propre (ex: "243xxxx:12@s.whatsapp.net" -> "243xxxx")
 */
function cleanId(id) {
    if (!id) return '';
    return String(id).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

/**
 * Génère le chemin du fichier de configuration.
 */
function getSettingsPath(ownerId, groupId = null, createIfMissing = false) {
    const cleanOwnerId = cleanId(ownerId);
    
    // 🛡️ Sécurité : Si l'ID est vide, on empêche l'écriture dans la racine
    if (!cleanOwnerId) {
        return null;
    }

    let baseDir;
    if (groupId) {
        const cleanGroupId = cleanId(groupId);
        baseDir = path.join('/home/container/Kaya-MD', "userall", cleanOwnerId, cleanGroupId);
    } else {
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
    const cleanOwnerId = cleanId(ownerId);
    if (!cleanOwnerId) return defaultValue;

    const cleanGroupId = groupId ? cleanId(groupId) : null;
    const cacheKey = cleanGroupId ? `${cleanOwnerId}:${cleanGroupId}` : cleanOwnerId;
    
    if (!cache.has(cacheKey)) {
        try {
            const filePath = getSettingsPath(ownerId, groupId, false);
            if (filePath && fs.existsSync(filePath)) {
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
 * Enregistre un réglage (Asynchrone)
 */
export async function setSetting(ownerId, key, value, groupId = null) {
    const cleanOwnerId = cleanId(ownerId);
    if (!cleanOwnerId) return;

    try {
        const cleanGroupId = groupId ? cleanId(groupId) : null;
        const cacheKey = cleanGroupId ? `${cleanOwnerId}:${cleanGroupId}` : cleanOwnerId;
        
        if (!cache.has(cacheKey)) {
            getSetting(ownerId, key, false, groupId);
        }

        const settings = cache.get(cacheKey) || {};
        settings[key] = value;
        
        cache.set(cacheKey, settings);
        
        const filePath = getSettingsPath(ownerId, groupId, true); 
        if (filePath) {
            await writeFile(filePath, JSON.stringify(settings, null, 2));
        }
        
    } catch (e) {
        console.error(`[SETTING] Erreur sauvegarde ${ownerId}:`, e);
    }
}
