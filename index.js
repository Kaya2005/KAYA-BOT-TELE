/**index.js
   𓊈𖣐𓊉DEV BY @MrBuddhaPrime𓊈𖣐𓊉
   𓊈𖣐𓊉MY PRIME SHALL COME BACK𓊈𖣐𓊉
*/

import fs from 'fs';
import readline from 'readline';
import chalk from 'chalk';

import {
    startupPassword
} from './token.js';

import {
    restoreSessions,
    watchPairingRequests
} from './pair.js';

import {
    startAutoCleanup
} from './cleanup.js';

// ==========================================
// AUTH FILE
// ==========================================

const AUTH_FILE =
    './richstore/auth.json';

// ==========================================
// DOSSIER RICHSTORE
// ==========================================

if (
    !fs.existsSync(
        './richstore'
    )
) {

    fs.mkdirSync(
        './richstore',
        {
            recursive: true
        }
    );
}

// ==========================================
// INITIALISATION
// ==========================================

const initializeBot =
    async () => {

        if (
            isAuthenticated()
        ) {

            await launchBot();

        } else {

            const rl =
                readline.createInterface({
                    input:
                        process.stdin,

                    output:
                        process.stdout
                });

            rl.stdoutMuted =
                true;

            console.log(
                chalk.bold.yellow(
                    'Enter password to start bot: '
                )
            );

            rl.question(
                chalk.green(
                    'Password: '
                ),
                function (input) {

                    if (
                        input !==
                        startupPassword
                    ) {

                        process.exit(1);
                    }

                    setAuthenticated(
                        true
                    );

                    rl.close();

                    launchBot();
                }
            );

            rl._writeToOutput =
                function (
                    stringToWrite
                ) {

                    if (
                        rl.stdoutMuted
                    ) {

                        rl.output.write(
                            '*'
                        );

                    } else {

                        rl.output.write(
                            stringToWrite
                        );
                    }
                };
        }
    };

// ==========================================
// AUTHENTIFICATION
// ==========================================

function isAuthenticated() {

    try {

        if (
            !fs.existsSync(
                AUTH_FILE
            )
        ) {

            return false;
        }

        const data =
            JSON.parse(
                fs.readFileSync(
                    AUTH_FILE,
                    'utf8'
                )
            );

        return Boolean(
            data.authenticated
        );

    } catch {

        return false;
    }
}

// ==========================================
// ENREGISTRER AUTH
// ==========================================

function setAuthenticated(
    value
) {

    fs.writeFileSync(
        AUTH_FILE,
        JSON.stringify(
            {
                authenticated:
                    value
            },
            null,
            2
        )
    );
}

// ==========================================
// LANCEMENT
// ==========================================

async function launchBot() {

    global.botName =
        'KAYA-MD';

    // ==========================================
    // CLEANUP
    // ==========================================

    startAutoCleanup();

    // ==========================================
    // BOT TELEGRAM
    // ==========================================

    import('./bot.js')
        .catch(error => {

            console.error(
                '[BOT IMPORT ERROR]',
                error
            );
        });

    // ==========================================
    // RESTAURATION SESSIONS
    // ==========================================

    console.log(
        chalk.blue(
            '⏳ Restauration des sessions en cours...'
        )
    );

    await restoreSessions();

    // ==========================================
    // DÉLAI SÉCURITÉ
    // ==========================================

    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                5000
            )
    );

    // ==========================================
    // WATCHER PAIRING
    // ==========================================

    console.log(
        chalk.blue(
            '🚀 Surveillance des demandes de pairage activée.'
        )
    );

    watchPairingRequests();

    // ==========================================
    // GESTION ERREURS
    // ==========================================

    const ignoredErrors = [

        'Socket connection timeout',

        'EKEYTYPE',

        'item-not-found',

        'Connection Closed',

        'Timed Out',

        'Value not found',

        'Socket closed',

        'ReferenceError'
    ];

    process.on(
        'uncaughtException',
        err => {

            const message =
                String(
                    err?.message ||
                    err
                );

            if (
                ignoredErrors.some(
                    item =>
                        message.includes(
                            item
                        )
                )
            ) {

                return;
            }

            console.error(
                err?.message ||
                err
            );
        }
    );

    process.on(
        'unhandledRejection',
        reason => {

            const message =
                String(
                    reason?.message ||
                    reason
                );

            if (
                ignoredErrors.some(
                    item =>
                        message.includes(
                            item
                        )
                )
            ) {

                return;
            }

            console.error(
                reason?.message ||
                reason
            );
        }
    );

    // ==========================================
    // LOGS
    // ==========================================

    console.log =
        (
            message,
            ...args
        ) => {

            process.stdout.write(
                chalk.white(
                    new Date()
                        .toLocaleTimeString()
                ) +
                ' ' +
                message +
                ' ' +
                args.join(' ') +
                '\n'
            );
        };

    console.error =
        message => {

            process.stderr.write(
                chalk.red(
                    '[ERROR] '
                ) +
                (
                    message?.stack ||
                    message
                ) +
                '\n'
            );
        };
}

// ==========================================
// START
// ==========================================

initializeBot()
    .catch(
        error => {

            console.error(
                '[STARTUP ERROR]',
                error
            );

            process.exit(1);
        }
    );
