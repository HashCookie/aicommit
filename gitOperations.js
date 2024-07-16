const { exec } = require("child_process");

const repoPath = process.cwd();

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
    exec(`git -C ${repoPath} diff --staged`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

module.exports = { isGitRepository, checkStagedChanges, executeDiff };
