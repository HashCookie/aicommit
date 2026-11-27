import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const MAX_BUFFER = 10 * 1024 * 1024; // 10MB
const MAX_FILE_DIFF_CHARS = 4000;
const LINE_SPLIT_RE = /\r?\n/u;
const IGNORED_FILES = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
]);
const IGNORED_EXTENSIONS = [
  ".min.js",
  ".min.css",
  ".map",
  ".svg",
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".woff",
  ".woff2",
  ".pdf",
];

function isIgnoredFile(filePath) {
  const lower = filePath.toLowerCase();
  const baseName = lower.split("/").pop();
  if (IGNORED_FILES.has(baseName)) {
    return true;
  }
  return IGNORED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function truncateFileDiff(diff, maxChars = MAX_FILE_DIFF_CHARS) {
  if (diff.length <= maxChars) {
    return diff;
  }
  const omitted = diff.length - maxChars;
  return `${diff.slice(0, maxChars)}\n... (truncated ${omitted} chars)`;
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

async function stageTrackedChanges(cwd = process.cwd()) {
  await runGit(["add", "-u"], cwd);
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
    .split(LINE_SPLIT_RE)
    .filter(Boolean)
    .map((line) => {
      const [rawStatus, firstFile, secondFile] = line.split("\t");
      const [status] = rawStatus;
      if ((status === "R" || status === "C") && secondFile) {
        return { status, oldFile: firstFile, file: secondFile };
      }
      return { status, file: firstFile };
    })
    .filter(({ file }) => file && !isIgnoredFile(file));
}

async function getStagedDiff(cwd = process.cwd()) {
  const nameStatus = await runGit(["diff", "--staged", "--name-status"], cwd);
  const changes = parseNameStatus(nameStatus);

  if (changes.length === 0) {
    return "";
  }

  const statFiles = changes.map((c) => c.file);
  const stat = await runGit(
    ["diff", "--staged", "--stat", "--", ...statFiles],
    cwd
  ).catch(() => "");

  const diffs = await Promise.all(
    changes.map(async ({ status, oldFile, file }) => {
      if (status === "D") {
        return `Deleted: ${file}`;
      }
      if (status === "R") {
        const diff = await runGit(["diff", "--staged", "--", file], cwd).catch(
          () => ""
        );
        return diff ? truncateFileDiff(diff) : `Renamed: ${oldFile} -> ${file}`;
      }
      try {
        const diff = await runGit(["diff", "--staged", "--", file], cwd);
        return truncateFileDiff(diff);
      } catch (error) {
        return `Changed (${status}): ${file} (diff unavailable: ${error.message})`;
      }
    })
  );

  const body = diffs.filter(Boolean).join("\n");
  return stat.trim() ? `${stat.trim()}\n\n${body}` : body;
}

function commitChanges(message, cwd = process.cwd()) {
  return runGit(["commit", "-m", message], cwd);
}

function createAndCheckoutBranch(branchName, cwd = process.cwd()) {
  return runGit(["checkout", "-b", branchName], cwd);
}

export {
  commitChanges,
  createAndCheckoutBranch,
  getStagedDiff,
  hasStagedChanges,
  isGitRepository,
  isIgnoredFile,
  MAX_FILE_DIFF_CHARS,
  parseNameStatus,
  stageTrackedChanges,
  truncateFileDiff,
};
