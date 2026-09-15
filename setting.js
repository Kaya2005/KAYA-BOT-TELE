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
 * Génère le chemin unique du fichier de configuration de l'owner.
 */
function getSettingsPath(ownerId, createIfMissing = false) {
    const cleanOwnerId = cleanId(ownerId);
    
    // 🛡️ Sécurité : Si l'ID est vide, on empêche l'écriture dans la racine
    if (!cleanOwnerId) {
        return null;
    }

    // Le chemin pointe directement vers : /home/container/Kaya-MD/userall/NUMERO_OWNER/settings.json
    const baseDir = path.join('/home/container/Kaya-MD', "userall", cleanOwnerId);
    
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

    // On utilise uniquement l'ownerId comme clé de cache, peu importe le groupId passé en paramètre
    const cacheKey = cleanOwnerId;
    
    if (!cache.has(cacheKey)) {
        try {
            const filePath = getSettingsPath(ownerId, false);
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
        const cacheKey = cleanOwnerId;
        
        if (!cache.has(cacheKey)) {
            getSetting(ownerId, key, false);
        }

        const settings = cache.get(cacheKey) || {};
        settings[key] = value;
        
        cache.set(cacheKey, settings);
        
        const filePath = getSettingsPath(ownerId, true); 
        if (filePath) {
            await writeFile(filePath, JSON.stringify(settings, null, 2));
        }
        
    } catch (e) {
        console.error(`[SETTING] Erreur sauvegarde ${ownerId}:`, e);
    }
}
