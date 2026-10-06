import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const REPO_DIR = "/home/container/Kaya-MD";

function getLocalCommit() {
  try {
    return execSync(`git -C ${REPO_DIR} log -1 --pretty=format:"%h|%s|%cr"`)
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function getRemoteCommit() {
  try {
    return execSync(`git -C ${REPO_DIR} rev-parse origin/main`)
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function getCurrentCommit() {
  try {
    return execSync(`git -C ${REPO_DIR} rev-parse HEAD`)
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function getChangedFilesDetails() {
  try {
    const output = execSync(`git -C ${REPO_DIR} diff --name-status HEAD@{1} HEAD`)
      .toString()
      .trim();
    if (!output) return [];
    
    return output.split("\n").map(line => {
      const [status, filePath] = line.split("\t");
      let icon = "📂";
      if (status === "A") icon = "✨ [Ajout]";
      if (status === "M") icon = "✏️ [Modifié]";
      if (status === "D") icon = "🗑️ [Supprimé]";
      return `${icon} ${filePath}`;
    });
  } catch {
    return [];
  }
}

function bar(p) {
  const total = 10;
  const filled = Math.round((p / 100) * total);
  return "▰".repeat(filled) + "▱".repeat(total - filled) + ` ${p}%`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default {
  name: "update",
  alias: ["maj"],
  description: "Update the bot live with detailed changelog",
  category: "Owner",
  ownerOnly: true,

  async execute(kaya, mek, from) {
    try {
      const msg = await kaya.sendMessage(
        from,
        { text: `🔄 Checking for updates...\n${bar(10)}` },
        { quoted: mek }
      );

      const edit = async (text) => {
        await kaya.sendMessage(from, { text, edit: msg.key });
      };

      await sleep(400);
      await edit(`🔍 Verifying repository...\n${bar(25)}`);

      // 1. Récupération des nouveautés depuis le serveur distant
      execSync(`git -C ${REPO_DIR} fetch origin main`, { stdio: "ignore" });

      const local = getCurrentCommit();
      const remote = getRemoteCommit();

      if (!remote) {
        return edit("❌ Failed to verify remote repository.");
      }

      if (local === remote) {
        return edit(
          `📦 ALREADY UP TO DATE\n${bar(100)}\n\n✔ No changes detected.\n⚡ The bot is running the latest version.`
        );
      }

      await sleep(400);
      await edit(`⬇️ Downloading updates...\n${bar(50)}`);

      try {
        // CORRECTION : Annule tout conflit/merge en attente et force l'alignement sur origin/main
        execSync(`git -C ${REPO_DIR} merge --abort`, { stdio: "ignore" }); // Au cas où un merge est en cours
      } catch {
        // Ignorer si aucun merge n'est en cours
      }

      try {
        // Forcer le reset directement sur la version à jour de GitHub
        execSync(`git -C ${REPO_DIR} reset --hard origin/main`, { stdio: "ignore" });
      } catch (err) {
        return edit(`❌ Update failed during git reset: ${err.message}`);
      }

      await sleep(400);
      await edit(`⚙️ Analyzing changes...\n${bar(80)}`);

      const changedDetails = getChangedFilesDetails();
      const localAfter = getLocalCommit();
      const [commitHash, commitMsg, commitTime] = localAfter ? localAfter.split("|") : ["N/A", "Mise à jour du bot", "Récemment"];

      // 💾 Enregistrement des infos de mise à jour dans le dossier utils
      const utilsDir = path.join(process.cwd(), 'utils');
      if (!fs.existsSync(utilsDir)) {
        fs.mkdirSync(utilsDir, { recursive: true });
      }

      const updateInfo = {
        commitHash,
        commitMsg,
        commitTime,
        changed: changedDetails
      };
      
      fs.writeFileSync(path.join(utilsDir, 'update_status.json'), JSON.stringify(updateInfo, null, 2));

      await sleep(400);
      await edit(
        `🚀 **UPDATE COMPLETED**\n${bar(100)}\n\n` +
        `📌 **Commit :** \`${commitHash}\`\n` +
        `💬 **Message :** _${commitMsg}_\n\n` +
        `♻️ Restarting bot to apply changes...`
      );

      setTimeout(() => {
        process.exit(0);
      }, 2000);

    } catch (e) {
      console.error("UPDATE ERROR:", e);
      await kaya.sendMessage(
        from,
        { text: `❌ Update failed.\n\n${e.message}` },
        { quoted: mek }
      );
    }
  },
};
