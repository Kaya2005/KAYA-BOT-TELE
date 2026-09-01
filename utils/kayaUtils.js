// ==========================================
// FILE: ./utils/kayaUtils.js
// SIMPLE MESSAGE RATE LIMITER
// ==========================================

import { getSetting } from '../setting.js';

// ==========================================
// CONFIGURATION
// ==========================================

// Nombre maximum de messages par heure
const HOURLY_LIMIT = 300;

// Pause lorsque la limite est atteinte
const LIMIT_PAUSE = 60 * 1000;

// ==========================================
// STOCKAGE
// ==========================================

const messageCounter = new Map();

// Empêche plusieurs notifications pendant
// la même période de pause
const warningTracker = new Map();

// ==========================================
// DÉLAI ALÉATOIRE
// ==========================================

export const randomDelay = (
    min = 5000,
    max = 8000
) => new Promise(resolve =>
    setTimeout(
        resolve,
        Math.floor(
            Math.random() * (max - min + 1)
        ) + min
    )
);

// ==========================================
// RÉCUPÉRER LE PROFIL DE VITESSE
// ==========================================

function getSpeedRange(kaya) {

    const ownerId = kaya.user?.id
        ? kaya.user.id.split(':')[0]
        : '';

    const speedProfile = getSetting(
        ownerId,
        'botSpeed',
        '5-8'
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
            return [5000, 8000];
    }
}

// ==========================================
// NETTOYAGE DES ANCIENNES DONNÉES
// ==========================================

function cleanOldData(number, now) {

    const stats = messageCounter.get(number);

    if (!stats) {
        return null;
    }

    // Nouvelle fenêtre d'une heure
    if (
        now - stats.lastReset >=
        60 * 60 * 1000
    ) {

        messageCounter.delete(number);
        warningTracker.delete(number);

        return null;
    }

    return stats;
}

// ==========================================
// NOTIFICATION
// UNE SEULE FOIS PAR PAUSE
// ==========================================

async function sendPauseNotification(
    kaya,
    originalSendMessage,
    jid
) {

    const number = jid.split('@')[0];

    // Si une notification a déjà été envoyée
    // pendant cette pause, on ne renvoie rien.
    if (
        warningTracker.get(number) === true
    ) {
        return;
    }

    warningTracker.set(number, true);

    try {

        await originalSendMessage.call(
            kaya,
            jid,
            {
                text:
                    "🛡️ *ANTI-SPAM PROTECTION*\n\n" +
                    "The bot has temporarily reached its message limit.\n\n" +
                    "⏸️ Sending is paused for *60 seconds*.\n\n" +
                    "🔄 The bot will automatically resume after the pause.\n\n" +
                    "Please wait."
            },
            {}
        );

        console.log(
            `[ANTI-SPAM] Notification sent to ${number}`
        );

    } catch (error) {

        console.log(
            `[ANTI-SPAM] Unable to send notification to ${number}:`,
            error?.message || error
        );
    }
}

// ==========================================
// ENVOI SÉCURISÉ
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

    const number = String(jid)
        .split('@')[0]
        .split(':')[0]
        .replace(/\D/g, '');

    if (!number) {
        throw new Error(
            `Invalid JID: ${jid}`
        );
    }

    const now = Date.now();

    // ==========================================
    // RÉCUPÉRATION DES STATISTIQUES
    // ==========================================

    let stats =
        cleanOldData(
            number,
            now
        );

    if (!stats) {

        stats = {
            count: 0,
            lastReset: now,
            pausedUntil: 0
        };

        messageCounter.set(
            number,
            stats
        );
    }

    // ==========================================
    // PAUSE DÉJÀ ACTIVE
    // ==========================================

    if (
        stats.pausedUntil > now
    ) {

        const remaining =
            stats.pausedUntil - now;

        console.log(
            `[ANTI-SPAM] ${number} is paused for ${Math.ceil(remaining / 1000)}s`
        );

        await sendPauseNotification(
            kaya,
            originalSendMessage,
            jid
        );

        await new Promise(resolve =>
            setTimeout(
                resolve,
                remaining
            )
        );

        // La pause est terminée
        stats.pausedUntil = 0;

        // On permet une nouvelle notification
        warningTracker.delete(number);
    }

    // ==========================================
    // LIMITE DES 300 MESSAGES
    // ==========================================

    if (
        stats.count >= HOURLY_LIMIT
    ) {

        console.log(
            `[BAN PROTECTION] Hourly limit reached for ${number}.`
        );

        stats.pausedUntil =
            Date.now() + LIMIT_PAUSE;

        await sendPauseNotification(
            kaya,
            originalSendMessage,
            jid
        );

        await new Promise(resolve =>
            setTimeout(
                resolve,
                LIMIT_PAUSE
            )
        );

        // Après la pause, on repart
        // avec une partie du compteur.
        stats.count = 150;

        stats.lastReset =
            Date.now();

        stats.pausedUntil = 0;

        // Nouvelle période possible
        warningTracker.delete(number);
    }

    // ==========================================
    // COMPTEUR
    // ==========================================

    stats.count++;

    messageCounter.set(
        number,
        stats
    );

    // ==========================================
    // DÉLAI DYNAMIQUE
    // ==========================================

    const [min, max] =
        getSpeedRange(kaya);

    await randomDelay(
        min,
        max
    );

    // ==========================================
    // ENVOI
    // ==========================================

    try {

        return await originalSendMessage.call(
            kaya,
            jid,
            content,
            options
        );

    } catch (err) {

        // ==========================================
        // RATE LIMIT WHATSAPP
        // ==========================================

        const errorText =
            String(
                err?.message ||
                err ||
                ''
            ).toLowerCase();

        if (
            errorText.includes('rate-overlimit') ||
            errorText.includes('429') ||
            errorText.includes('too many requests') ||
            errorText.includes('rate limit')
        ) {

            console.log(
                `[RATE LIMIT] WhatsApp restriction detected for ${number}.`
            );

            // Notification UNE SEULE FOIS
            await sendPauseNotification(
                kaya,
                originalSendMessage,
                jid
            );

            // Pause de sécurité
            await new Promise(resolve =>
                setTimeout(
                    resolve,
                    LIMIT_PAUSE
                )
            );

            // Autorise une nouvelle notification
            // lors d'une prochaine restriction.
            warningTracker.delete(number);

            // IMPORTANT :
            // On NE renvoie PAS automatiquement
            // le message qui a échoué.
            throw err;
        }

        throw err;
    }
}

// ==========================================
// NETTOYAGE MANUEL
// ==========================================

export function clearMessageCounter(number) {

    const cleanNumber =
        String(number)
            .replace(/\D/g, '');

    messageCounter.delete(
        cleanNumber
    );

    warningTracker.delete(
        cleanNumber
    );
}

// ==========================================
// STATISTIQUES
// ==========================================

export function getMessageStats(number) {

    const cleanNumber =
        String(number)
            .replace(/\D/g, '');

    const stats =
        messageCounter.get(
            cleanNumber
        );

    if (!stats) {

        return {
            count: 0,
            limit: HOURLY_LIMIT,
            remaining: HOURLY_LIMIT,
            paused: false
        };
    }

    const now = Date.now();

    return {

        count: stats.count,

        limit: HOURLY_LIMIT,

        remaining: Math.max(
            0,
            HOURLY_LIMIT - stats.count
        ),

        paused:
            stats.pausedUntil > now,

        pausedFor:
            Math.max(
                0,
                stats.pausedUntil - now
            )
    };
}