const inquirer = require("inquirer");
const { exec } = require("child_process");
const { getApiKey, getAIProvider, getAIModel } = require("./config");
const { DeepSeekProvider, MoonshotProvider } = require("./aiProviders");

const repoPath = process.cwd();
const MAX_DIFF_SIZE = 1000000; // 1MB

function getAIProviderInstance() {
  const apiKey = getApiKey();
  const provider = getAIProvider();

  switch (provider.toLowerCase()) {
    case "deepseek":
      return new DeepSeekProvider(apiKey);
    case "moonshot":
      return new MoonshotProvider(apiKey);
    default:
      throw new Error(`Unsupported AI providers: ${provider}`);
  }
}

async function generateCommitMessage(diff) {
  if (diff.length > MAX_DIFF_SIZE) {
    console.warn(
      "Diff is too large. Only the first 1MB will be used to generate the commit message."
    );
    diff = diff.substring(0, MAX_DIFF_SIZE);
  }

  const aiProvider = getAIProviderInstance();
  const model = getAIModel();

  try {
    return await aiProvider.generateCommitMessage(diff, model);
  } catch (error) {
    console.error("Error generating commit message.", error);
    return null;
  }
}

function promptCommit(commitMessage) {
  commitMessage = commitMessage.replace(/\n/g, "").trim();

  inquirer
    .prompt([
      {
        type: "confirm",
        name: "confirmCommit",
        message: `Generated commit messages:\n${commitMessage}\n\nDo you want to submit with this message?`,
        default: false,
      },
    ])
    .then((answers) => {
      if (answers.confirmCommit) {
        exec(
          `git -C ${repoPath} commit -m '${commitMessage}'`,
          (error, stdout, stderr) => {
            if (error) {
              console.error(`git commit error: ${error}`);
              console.error(`Stderr: ${stderr}`);
              if (stderr.includes("nothing to commit")) {
                console.log(
                  "There are no changes to commit. Use 'git add' to temporarily store the file."
                );
              }
              return;
            }
            console.log(stdout);
          }
        );
      } else {
        console.log("Submission has been canceled.");
      }
    });
}

module.exports = { generateCommitMessage, promptCommit };
