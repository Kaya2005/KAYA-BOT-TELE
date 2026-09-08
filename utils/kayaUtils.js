// ==========================================
// FILE: ./utils/kayaUtils.js
// SIMPLE MESSAGE SENDER
// ==========================================

import { getSetting } from '../setting.js';

// ==========================================
// DÉLAI ALÉATOIRE
// ==========================================

export const randomDelay = (
    min = 3000,
    max = 4000
) => new Promise(resolve =>
    setTimeout(
        resolve,
        Math.floor(
            Math.random() * (max - min + 1)
        ) + min
    )
);

// ==========================================
// NORMALISER LE NUMÉRO
// ==========================================

function getCleanNumber(jid = '') {

    return String(jid)
        .split('@')[0]
        .split(':')[0]
        .replace(/\D/g, '');
}

// ==========================================
// RÉCUPÉRER LE PROFIL DE VITESSE
// ==========================================

function getSpeedRange(kaya) {

    const ownerId =
        kaya?.user?.id
            ? String(kaya.user.id)
                .split(':')[0]
            : '';

    const speedProfile =
        getSetting(
            ownerId,
            'botSpeed',
            '3-4'
        );

    switch (speedProfile) {

        case '1-2':
            return [1000, 2000];

        case '2-3':
            return [2000, 3000];

        case '3-4':
            return [3000, 4000];

        case '4-6':
            return [4000, 6000];

        case '5-8':
            return [5000, 8000];

        case '6-10':
            return [6000, 10000];

        case '8-10':
            return [8000, 10000];

        case '10-15':
            return [10000, 15000];

        default:
            return [3000, 4000];
    }
}

// ==========================================
// ENVOI
// ==========================================

export async function sendLimited(
    kaya,
    originalSendMessage,
    jid,
    content,
    options = {}
) {

    if (
        !kaya ||
        !originalSendMessage
    ) {

        throw new Error(
            'Invalid WhatsApp socket or send function.'
        );
    }

    const number =
        getCleanNumber(jid);

    if (!number) {

        throw new Error(
            `Invalid JID: ${jid}`
        );
    }

    // ==========================================
    // DÉLAI SELON LA VITESSE DU BOT
    // ==========================================

    const [
        min,
        max
    ] =
        getSpeedRange(kaya);

    await randomDelay(
        min,
        max
    );

    // ==========================================
    // ENVOI DIRECT
    // ==========================================

    return await originalSendMessage.call(
        kaya,
        jid,
        content,
        options
    );
}

// ==========================================
// DESTRUCTION / NETTOYAGE SESSION
// ==========================================

export function destroySendQueue(
    kaya
) {

    if (!kaya) {
        return;
    }

    const number =
        kaya?.user?.id
            ? String(kaya.user.id)
                .split(':')[0]
                .replace(/\D/g, '')
            : '';

    if (number) {

        console.log(
            `[SEND QUEUE] 🧹 Session cleaned for ${number}.`
        );

        return;
    }

    console.log(
        `[SEND QUEUE] 🧹 Session cleaned.`
    );
}

// ==========================================
// COMPATIBILITÉ
// ==========================================
// Ces fonctions sont conservées pour éviter
// les erreurs si d'autres fichiers les utilisent.
// Elles ne font plus de limitation.

// ==========================================
// NETTOYAGE MANUEL
// ==========================================

export function clearMessageCounter(
    number
) {

    const cleanNumber =
        String(number)
            .replace(/\D/g, '');

    console.log(
        `[ANTI-SPAM] 🧹 Counter reset for ${cleanNumber}`
    );
}

// ==========================================
// STATISTIQUES
// ==========================================

export function getMessageStats(
    number
) {

    return {

        count: 0,

        limit: Infinity,

        remaining: Infinity,

        paused: false,

        pausedFor: 0
    };
}