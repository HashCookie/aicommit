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
      `git -C ${repoPath} diff --staged --name-status`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        const changes = stdout
          .trim()
          .split("\n")
          .map((line) => {
            const [status, file] = line.split("\t");
            return { status, file };
          });

        const diffs = [];
        const promises = changes.map(({ status, file }) => {
          if (status === "D") {
            return Promise.resolve(`Deleted: ${file}`);
          } else {
            return new Promise((resolve) => {
              exec(
                `git -C ${repoPath} diff --staged -- "${file}"`,
                (err, diffOutput) => {
                  if (err) {
                    console.warn(
                      `Warning: Failed to get diff for ${file}:`,
                      err.message
                    );
                    resolve(`Failed to get diff for ${file}`);
                  } else {
                    resolve(diffOutput);
                  }
                }
              );
            });
          }
        });

        Promise.all(promises)
          .then((results) => {
            resolve(results.join("\n"));
          })
          .catch((error) => {
            console.error("Error processing diffs:", error);
            resolve("Failed to process all diffs");
          });
      }
    );
  });
}

module.exports = { isGitRepository, checkStagedChanges, executeDiff };
