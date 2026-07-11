import { execSync } from "child_process";

const REPO_DIR = process.cwd();

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
    return execSync(`git ls-remote https://github.com/Kaya2005/KAYA-BOT-TELE.git HEAD`)
      .toString()
      .split("\t")[0];
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

  async execute(kaya, mek, from, args) {
    try {
      const localBefore = getLocalCommit();

      let msg = await kaya.sendMessage(
        from,
        { text: `🔄 Checking for updates...\n${bar(10)}` },
        { quoted: mek }
      );

      const edit = async (text) => {
        await kaya.sendMessage(from, { text, edit: msg.key });
      };

      /* ================= FETCH ================= */
      await sleep(400);
      await edit(`🔍 Verifying repository...\n${bar(25)}`);

      execSync(`git -C ${REPO_DIR} fetch`, { stdio: "ignore" });

      const remote = getRemoteCommit();
      if (!remote) return edit("❌ Failed to verify remote repository.");

      /* ================= PULL ================= */
      await sleep(400);
      await edit(`⬇️ Downloading updates...\n${bar(50)}`);

      execSync(`git -C ${REPO_DIR} stash`, { stdio: "ignore" });
      execSync(`git -C ${REPO_DIR} pull origin main`, { stdio: "ignore" });
      execSync(`git -C ${REPO_DIR} stash pop`, { stdio: "ignore" }).catch(() => {});

      /* ================= ANALYSIS ================= */
      await sleep(400);
      await edit(`⚙️ Analyzing changes...\n${bar(80)}`);

      const changed = getChangedFiles();
      const localAfter = getLocalCommit();

      if (!changed.length) {
        return edit(`📦 ALREADY UP TO DATE\n${bar(100)}\n\n✔ No changes detected.\n⚡ The bot is running the latest version.`);
      }

      /* ================= UPDATE DONE ================= */
      await sleep(400);
      await edit(
        `🚀 UPDATE COMPLETED\n${bar(100)}\n\n📌 Current commit:\n${localAfter || "N/A"}\n\n📂 Modified files (${changed.length}):\n${changed.slice(0, 6).map(f => `• ${f}`).join("\n")}\n\n♻️ Restarting now...`
      );

      setTimeout(() => {
        process.exit(0);
      }, 1500);

    } catch (e) {
      console.error("UPDATE ERROR:", e);
      await kaya.sendMessage(from, { text: "❌ Update failed." }, { quoted: mek });
    }
  },
};
