// ==================== setting.js ====================
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";

// 🚀 CACHE EN MÉMOIRE ET FILES D'ATTENTE D'ÉCRITURE
const cache = new Map();
const writeQueues = new Map();

/**
 * Nettoie un ID et extrait le numéro propre (compatible groupes et newsletters)
 */
function cleanId(id) {
    if (!id) return '';

    const strId = String(id);

    // Sécurité : Empêche formellement qu'un ID de groupe devienne un dossier d'owner
    if (strId.includes('@g.us')) {
        return '';
    }

    const cleanNumber = strId
        .split('@')[0]
        .split(':')[0]
        .replace(/[^0-9]/g, '');

    if (!cleanNumber || cleanNumber.length < 5) {
        return '';
    }

    return cleanNumber;
}

/**
 * Chemin du fichier settings.json
 */
function getSettingsPath(ownerId, createIfMissing = false) {
    const cleanOwnerId = cleanId(ownerId);

    if (!cleanOwnerId) {
        return null;
    }

    const baseDir = path.join(
        '/home/container/Kaya-MD',
        'userall',
        cleanOwnerId
    );

    if (
        createIfMissing &&
        !fs.existsSync(baseDir)
    ) {
        fs.mkdirSync(baseDir, {
            recursive: true
        });
    }

    return path.join(
        baseDir,
        'settings.json'
    );
}

/**
 * Charge les paramètres de l'owner
 */
function loadSettings(ownerId) {
    const cleanOwnerId = cleanId(ownerId);

    if (!cleanOwnerId) {
        return {};
    }

    if (cache.has(cleanOwnerId)) {
        return cache.get(cleanOwnerId);
    }

    try {
        const filePath = getSettingsPath(
            ownerId,
            false
        );

        let settings = {};

        if (
            filePath &&
            fs.existsSync(filePath)
        ) {
            settings = JSON.parse(
                fs.readFileSync(
                    filePath,
                    'utf8'
                ) || '{}'
            );
        }

        cache.set(
            cleanOwnerId,
            settings
        );

        return settings;

    } catch (e) {
        console.error(
            `[SETTING] Erreur lecture ${cleanOwnerId}:`,
            e
        );

        const settings = {};

        cache.set(
            cleanOwnerId,
            settings
        );

        return settings;
    }
}

/**
 * Récupère un réglage
 */
export function getSetting(
    ownerId,
    key,
    defaultValue = false,
    groupId = null
) {
    const settings = loadSettings(ownerId);

    if (groupId !== null) {
        const cleanGroupId = cleanId(groupId);

        if (
            settings[key] &&
            typeof settings[key] === 'object' &&
            !Array.isArray(settings[key])
        ) {
            return Object.prototype.hasOwnProperty.call(
                settings[key],
                cleanGroupId
            )
                ? settings[key][cleanGroupId]
                : defaultValue;
        }

        return defaultValue;
    }

    return Object.prototype.hasOwnProperty.call(
        settings,
        key
    )
        ? settings[key]
        : defaultValue;
}

/**
 * Enregistre un réglage (Stockage optimisé avec persistance des états désactivés)
 */
export async function setSetting(
    ownerId,
    key,
    value,
    groupId = null
) {
    const cleanOwnerId = cleanId(ownerId);

    if (!cleanOwnerId) {
        return;
    }

    try {
        const settings = loadSettings(ownerId);

        if (groupId !== null) {
            const cleanGroupId = cleanId(groupId);

            if (
                !settings[key] ||
                typeof settings[key] !== 'object' ||
                Array.isArray(settings[key])
            ) {
                settings[key] = {};
            }

            settings[key][cleanGroupId] = value;

        } else {
            settings[key] = value;
        }

        cache.set(
            cleanOwnerId,
            settings
        );

        // Système de file d'attente d'écriture (Debounce 1 seconde) pour protéger le disque
        if (writeQueues.has(cleanOwnerId)) {
            clearTimeout(writeQueues.get(cleanOwnerId));
        }

        writeQueues.set(
            cleanOwnerId,
            setTimeout(async () => {
                try {
                    const filePath = getSettingsPath(cleanOwnerId, true);
                    if (filePath) {
                        // Écriture compacte sur 1 ligne pour économiser l'espace disque
                        await writeFile(
                            filePath,
                            JSON.stringify(settings),
                            'utf8'
                        );
                    }
                } catch (err) {
                    console.error(`[SETTING] Erreur écriture fichier ${cleanOwnerId}:`, err);
                } finally {
                    writeQueues.delete(cleanOwnerId);
                }
            }, 1000)
        );

    } catch (e) {
        console.error(
            `[SETTING] Erreur sauvegarde ${cleanOwnerId}:`,
            e
        );
    }
}
