import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const MAX_BUFFER = 10 * 1024 * 1024; // 10MB
const IGNORED_FILES = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
]);

function isIgnoredFile(filePath) {
  const baseName = filePath.split("/").pop();
  return IGNORED_FILES.has(baseName);
}

async function runGit(args, cwd = process.cwd()) {
  const { stdout } = await execFileAsync("git", ["-C", cwd, ...args], {
    maxBuffer: MAX_BUFFER,
  });
  return stdout;
}

async function isGitRepository(cwd = process.cwd()) {
  try {
    await runGit(["rev-parse", "--is-inside-work-tree"], cwd);
    return true;
  } catch {
    return false;
  }
}

async function hasStagedChanges(cwd = process.cwd()) {
  try {
    await runGit(["diff", "--staged", "--quiet"], cwd);
    return false;
  } catch (error) {
    if (error.code === 1) {
      return true;
    }
    throw error;
  }
}

function parseNameStatus(stdout) {
  return stdout
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      const rawStatus = parts[0];
      const status = rawStatus[0];
      if ((status === "R" || status === "C") && parts.length >= 3) {
        return { status, oldFile: parts[1], file: parts[2] };
      }
      return { status, file: parts[1] };
    })
    .filter(({ file }) => file && !isIgnoredFile(file));
}

async function getStagedDiff(cwd = process.cwd()) {
  const nameStatus = await runGit(["diff", "--staged", "--name-status"], cwd);
  const changes = parseNameStatus(nameStatus);

  if (changes.length === 0) {
    return "";
  }

  const diffs = await Promise.all(
    changes.map(async ({ status, oldFile, file }) => {
      if (status === "D") {
        return `Deleted: ${file}`;
      }
      if (status === "R") {
        const diff = await runGit(["diff", "--staged", "--", file], cwd).catch(
          () => ""
        );
        return diff || `Renamed: ${oldFile} -> ${file}`;
      }
      try {
        return await runGit(["diff", "--staged", "--", file], cwd);
      } catch (error) {
        return `Changed (${status}): ${file} (diff unavailable: ${error.message})`;
      }
    })
  );

  return diffs.filter(Boolean).join("\n");
}

async function commitChanges(message, cwd = process.cwd()) {
  return await runGit(["commit", "-m", message], cwd);
}

async function createAndCheckoutBranch(branchName, cwd = process.cwd()) {
  return await runGit(["checkout", "-b", branchName], cwd);
}

export {
  isGitRepository,
  hasStagedChanges,
  parseNameStatus,
  getStagedDiff,
  commitChanges,
  createAndCheckoutBranch,
};
