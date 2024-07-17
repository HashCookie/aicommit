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

function executeDiff() {
  return new Promise((resolve, reject) => {
    exec(
      `git -C ${repoPath} diff --staged --name-only`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        const stagedFiles = stdout
          .split("\n")
          .filter((file) => file.trim() !== "");
        const filteredFiles = stagedFiles.filter(
          (file) => !ignoredFiles.some((ignored) => file.includes(ignored))
        );

        if (filteredFiles.length === 0) {
          resolve("");
          return;
        }

        const diffCommand = `git -C ${repoPath} diff --staged ${filteredFiles.join(
          " "
        )}`;
        exec(diffCommand, (diffError, diffStdout, diffStderr) => {
          if (diffError) {
            reject(diffError);
          } else {
            resolve(diffStdout);
          }
        });
      }
    );
  });
}

module.exports = { isGitRepository, checkStagedChanges, executeDiff };
