/**index.js
   𓊈𖣐𓊉DEV BY @MrBuddhaPrime𓊈𖣐𓊉
   𓊈𖣐𓊉MY PRIME SHALL COME BACK𓊈𖣐𓊉
*/

import fs from 'fs';
import readline from 'readline';
import chalk from 'chalk';
import { startupPassword } from './token.js';
import { restoreSessions, watchPairingRequests } from './pair.js';

const AUTH_FILE = './richstore/auth.json';

// Assurer que le dossier richstore existe
if (!fs.existsSync('./richstore')) fs.mkdirSync('./richstore');

const initializeBot = async () => {
  if (isAuthenticated()) {
    launchBot();
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.stdoutMuted = true;
    console.log(chalk.bold.yellow('Enter password to start bot: '));
    rl.question(chalk.green('Password: '), function (input) {
      if (input !== startupPassword) {
        process.exit(1);
      }
      setAuthenticated(true);
      rl.close();
      launchBot();
    });
    rl._writeToOutput = function (stringToWrite) {
      if (rl.stdoutMuted) rl.output.write("*");
      else rl.output.write(stringToWrite);
    };
  }
};

function isAuthenticated() {
  return fs.existsSync(AUTH_FILE) && JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')).authenticated;
}

function setAuthenticated(value) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ authenticated: value }, null, 2));
}

async function launchBot() {
  global.botName = 'KAYA-MD';

  // Import dynamique
  import('./bot.js');

  // Restauration des sessions existantes avec délai de sécurité
  console.log(chalk.blue("⏳ Restauration des sessions en cours..."));
  await restoreSessions();
  
  // AJOUT : Délai de 5 secondes pour laisser le système de fichiers se stabiliser
  await new Promise(resolve => setTimeout(resolve, 5000));

  // ACTIVATION DE LA SURVEILLANCE DES DEMANDES DE PAIRAGE
  console.log(chalk.blue("🚀 Surveillance des demandes de pairage activée."));
  watchPairingRequests();

  // ================= ERROR HANDLING ROBUSTE =================
  const ignoredErrors = [
    'Socket connection timeout', 'EKEYTYPE', 'item-not-found',
    'rate-overlimit', 'Connection Closed', 'Timed Out', 'Value not found',
    'Socket closed', 'ReferenceError'
  ];

  process.on('uncaughtException', (err) => {
    if (ignoredErrors.some((e) => String(err).includes(e))) return;
    console.error(err);
  });

  process.on('unhandledRejection', (reason) => {
    if (ignoredErrors.some((e) => String(reason).includes(e))) return;
    console.error(reason);
  });

  // RÉACTIVATION DES LOGS POUR DÉBOGUER
  console.log = (message, ...args) => {
      process.stdout.write(chalk.white(new Date().toLocaleTimeString()) + ' ' + message + ' ' + args.join(' ') + '\n');
  };
  
  console.error = (message) => {
      process.stderr.write(chalk.red('[ERROR] ') + message + '\n');
  };
}

initializeBot().catch(() => {});
