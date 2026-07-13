import { execSync } from "child_process";

// Chemin absolu vers votre dossier
const REPO_DIR = "/home/container/Kaya-MD";

/* ================= GIT HELPERS ================= */
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

function getChangedFiles() {
  try {
    return execSync(`git -C ${REPO_DIR} diff --name-only HEAD@{1} HEAD`)
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

/* ================= PROGRESS BAR ================= */
function bar(p) {
  const total = 10;
  const filled = Math.round((p / 100) * total);
  return "▰".repeat(filled) + "▱".repeat(total - filled) + ` ${p}%`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= UPDATE COMMAND ================= */
export default {
  name: "update",
  alias: ["maj"],
  description: "Update the bot live",
  category: "System",
  ownerOnly: true,

  async execute(kaya, mek, from) {
    try {
      // 1. Initialisation de la mise à jour
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

      // 2. Fetch du dépôt
      execSync(`git -C ${REPO_DIR} fetch origin`, { stdio: "ignore" });

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

      // 3. Application des changements
      await sleep(400);
      await edit(`⬇️ Downloading updates...\n${bar(50)}`);

      try {
        execSync(`git -C ${REPO_DIR} stash`, { stdio: "ignore" });
        execSync(`git -C ${REPO_DIR} pull origin main`, { stdio: "ignore" });
        try { execSync(`git -C ${REPO_DIR} stash pop`, { stdio: "ignore" }); } catch {}
      } catch (err) {
        return edit(`❌ Update failed during git pull: ${err.message}`);
      }

      await sleep(400);
      await edit(`⚙️ Analyzing changes...\n${bar(80)}`);

      const changed = getChangedFiles();
      const localAfter = getLocalCommit();

      // 4. Finalisation
      await sleep(400);
      await edit(
        `🚀 UPDATE COMPLETED\n${bar(100)}\n\n📌 Current commit:\n${localAfter || "N/A"}\n\n📂 Modified files (${changed.length}):\n${
          changed.length
            ? changed.slice(0, 6).map(f => `• ${f}`).join("\n")
            : "• Various files"
        }\n\n♻️ Restarting now...`
      );

      // Redémarrage sécurisé
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
