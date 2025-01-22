const { exec } = require("child_process");

const repoPath = process.cwd();

const ignoredFiles = [
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "node_modules",
];

function isGitRepository() {
  return new Promise((resolve) => {
    exec("git rev-parse --is-inside-work-tree", (error) => {
      resolve(!error);
    });
  });
}

function checkStagedChanges() {
  return new Promise((resolve, reject) => {
    exec(`git -C ${repoPath} diff --staged --quiet`, (error) => {
      if (error && error.code === 1) {
        resolve(true);
      } else if (!error) {
        resolve(false);
      } else {
        reject(error);
      }
    });
  });
}

async function executeDiff() {
  try {
    const stdout = await execPromise(
      `git -C ${repoPath} diff --staged --name-status`
    );
    const changes = stdout
      .trim()
      .split("\n")
      .map((line) => {
        const [status, file] = line.split("\t");
        return { status, file };
      })
      .filter(
        ({ file }) => !ignoredFiles.some((ignored) => file.includes(ignored))
      );

    const diffs = await Promise.all(
      changes.map(async ({ status, file }) => {
        if (status === "D") {
          return `Deleted: ${file}`;
        }
        try {
          const diffOutput = await execPromise(
            `git -C ${repoPath} diff --staged -- "${file}"`
          );
          return diffOutput;
        } catch (err) {
          console.warn(`Warning: Failed to get diff for ${file}:`, err.message);
          return `Failed to get diff for ${file}`;
        }
      })
    );

    return diffs.join("\n");
  } catch (error) {
    console.error("Error executing diff:", error);
    throw error;
  }
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function createAndCheckoutBranch(branchName) {
  return new Promise((resolve, reject) => {
    exec(
      `git -C ${repoPath} checkout -b ${branchName}`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

module.exports = {
  isGitRepository,
  checkStagedChanges,
  executeDiff,
  createAndCheckoutBranch,
};
