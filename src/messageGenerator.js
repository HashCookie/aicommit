const inquirer = require("inquirer");
const { exec } = require("child_process");
const { getApiKey, getAIProvider, getAIModel } = require("./config");
const {
  DeepSeekProvider,
  MoonshotProvider,
  DeepbricksProvider,
} = require("./aiProviders");

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
    case "deepbricks":
      return new DeepbricksProvider(apiKey);
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
        type: "list",
        name: "action",
        message: `Generated commit message:\n${commitMessage}\n\nWhat would you like to do?`,
        choices: ["Accept", "Edit", "Cancel"],
      },
    ])
    .then((answer) => {
      switch (answer.action) {
        case "Accept":
          executeCommit(commitMessage);
          break;
        case "Edit":
          inquirer
            .prompt([
              {
                type: "input",
                name: "editedMessage",
                message: "Edit the commit message:",
                default: commitMessage,
              },
            ])
            .then((editAnswer) => {
              executeCommit(editAnswer.editedMessage);
            });
          break;
        case "Cancel":
          console.log("Commit cancelled.");
          break;
      }
    });
}

function executeCommit(message) {
  exec(`git -C ${repoPath} commit -m '${message}'`, (error, stdout, stderr) => {
    if (error) {
      console.error(`git commit error: ${error}`);
      console.error(`Stderr: ${stderr}`);
      if (stderr.includes("nothing to commit")) {
        console.log(
          "There are no changes to commit. Use 'git add' to stage your changes."
        );
      }
      return;
    }
    console.log(stdout);
  });
}

module.exports = { generateCommitMessage, promptCommit };
