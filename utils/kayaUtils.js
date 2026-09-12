// ==========================================
// FILE: ./utils/kayaUtils.js
// SAFE MESSAGE QUEUE / RATE CONTROL
// ==========================================

import { getSetting } from '../setting.js';

// ==========================================
// STOCKAGE DES FILES D'ENVOI
// ==========================================

const sendQueues = new WeakMap();

// Statistiques par socket
const sendStats = new WeakMap();

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
// INITIALISER LES STATS
// ==========================================

function getStats(kaya) {
    if (!sendStats.has(kaya)) {
        sendStats.set(
            kaya,
            {
                count: 0,
                failed: 0,
                queued: 0,
                lastSend: 0
            }
        );
    }

    return sendStats.get(kaya);
}

// ==========================================
// ENVOI INTERNE
// ==========================================

async function processSend(
    kaya,
    originalSendMessage,
    jid,
    content,
    options
) {
    const stats = getStats(kaya);
    const [min, max] = getSpeedRange(kaya);

    // ==========================================
    // DÉLAI ENTRE LES ENVOIS
    // ==========================================

    await randomDelay(min, max);

    // ==========================================
    // VÉRIFICATION SOCKET (Optimisée Baileys)
    // ==========================================

    // On vérifie si la socket existe et possède au moins l'état de connexion ou l'objet ws
    if (!kaya || (!kaya.ws && !kaya.user)) {
        throw new Error('WhatsApp socket is not connected.');
    }

    // ==========================================
    // ENVOI
    // ==========================================

    try {
        const result = await originalSendMessage(
            jid,
            content,
            options
        );

        stats.count++;
        stats.lastSend = Date.now();

        return result;

    } catch (error) {
        stats.failed++;
        throw error;
    }
}

// ==========================================
// SEND LIMITED
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
        typeof originalSendMessage !== 'function'
    ) {
        throw new Error(
            'Invalid WhatsApp socket or send function.'
        );
    }

    const number = getCleanNumber(jid);

    if (!number) {
        throw new Error(`Invalid JID: ${jid}`);
    }

    // ==========================================
    // CRÉER UNE FILE POUR CETTE SESSION
    // ==========================================

    if (!sendQueues.has(kaya)) {
        sendQueues.set(
            kaya,
            {
                promise: Promise.resolve(),
                pending: 0,
                destroyed: false
            }
        );
    }

    const queue = sendQueues.get(kaya);

    if (queue.destroyed) {
        throw new Error('Send queue has been destroyed.');
    }

    // ==========================================
    // LIMITE DE SÉCURITÉ DE LA FILE
    // ==========================================

    const MAX_QUEUE = 50;

    if (queue.pending >= MAX_QUEUE) {
        throw new Error('Send queue is full.');
    }

    const stats = getStats(kaya);

    queue.pending++;
    stats.queued++;

    // ==========================================
    // AJOUT À LA FILE
    // ==========================================

    const current = queue.promise;

    let resolveTask;
    let rejectTask;

    const task = new Promise(
        (resolve, reject) => {
            resolveTask = resolve;
            rejectTask = reject;
        }
    );

    queue.promise = current
        .catch(() => {})
        .then(async () => {
            if (queue.destroyed) {
                throw new Error('Send queue destroyed.');
            }

            return processSend(
                kaya,
                originalSendMessage,
                jid,
                content,
                options
            );
        })
        .then(result => {
            queue.pending--;
            // On décrémente aussi le compteur de file dans les stats si besoin, 
            // mais getMessageStats utilise queue.pending donc c'est géré.
            resolveTask(result);
            return result;
        })
        .catch(error => {
            queue.pending--;
            rejectTask(error);
        });

    return task;
}

// ==========================================
// NETTOYAGE SESSION
// ==========================================

export function destroySendQueue(kaya) {
    if (!kaya) {
        return;
    }

    const queue = sendQueues.get(kaya);

    if (queue) {
        queue.destroyed = true;
        queue.pending = 0;
        queue.promise = Promise.resolve();
        sendQueues.delete(kaya);
    }

    sendStats.delete(kaya);

    const number =
        kaya?.user?.id
            ? String(kaya.user.id)
                .split(':')[0]
                .replace(/\D/g, '')
            : '';

    console.log(
        `[SEND QUEUE] 🧹 Session cleaned${number ? ` for ${number}` : ''}.`
    );
}

// ==========================================
// NETTOYAGE MANUEL
// ==========================================

export function clearMessageCounter(number) {
    const cleanNumber = String(number).replace(/\D/g, '');

    console.log(
        `[ANTI-SPAM] 🧹 Counter reset for ${cleanNumber}`
    );
}

// ==========================================
// STATISTIQUES
// ==========================================

export function getMessageStats(kaya) {
    if (!kaya) {
        return {
            count: 0,
            failed: 0,
            queued: 0,
            limit: Infinity,
            remaining: Infinity,
            paused: false,
            pausedFor: 0
        };
    }

    const stats = getStats(kaya);
    const queue = sendQueues.get(kaya);

    return {
        count: stats.count,
        failed: stats.failed,
        queued: queue?.pending || 0,
        limit: Infinity,
        remaining: Infinity,
        paused: false,
        pausedFor: 0,
        lastSend: stats.lastSend
    };
}
