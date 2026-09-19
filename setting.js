import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";

// 🚀 CACHE EN MÉMOIRE
const cache = new Map();

/**
 * Nettoie un ID
 */
function cleanId(id) {
    if (!id) return '';

    return String(id)
        .split('@')[0]
        .split(':')[0]
        .replace(/[^0-9]/g, '');
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
 *
 * Les réglages globaux sont stockés directement :
 *
 * welcomeAll: "on"
 *
 * Les réglages de groupe sont stockés ainsi :
 *
 * welcomeEnabled: {
 *     "120363xxxx": true,
 *     "120364xxxx": false
 * }
 */
export function getSetting(
    ownerId,
    key,
    defaultValue = false,
    groupId = null
) {
    const settings = loadSettings(ownerId);

    /*
     * Réglage spécifique à un groupe
     */
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

    /*
     * Réglage global
     */
    return Object.prototype.hasOwnProperty.call(
        settings,
        key
    )
        ? settings[key]
        : defaultValue;
}

/**
 * Enregistre un réglage
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

        /*
         * Réglage spécifique à un groupe
         */
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
            /*
             * Réglage global
             */
            settings[key] = value;
        }

        cache.set(
            cleanOwnerId,
            settings
        );

        const filePath = getSettingsPath(
            ownerId,
            true
        );

        if (filePath) {
            await writeFile(
                filePath,
                JSON.stringify(
                    settings,
                    null,
                    2
                )
            );
        }

    } catch (e) {
        console.error(
            `[SETTING] Erreur sauvegarde ${cleanOwnerId}:`,
            e
        );
    }
}