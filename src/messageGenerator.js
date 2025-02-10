import inquirer from "inquirer";
import { exec } from "child_process";
import { getApiKey, getAIProvider, getAIModel } from "./config.js";
import {
  DeepSeekProvider,
  MoonshotProvider,
  DeepbricksProvider,
} from "./aiProviders.js";
import { createAndCheckoutBranch } from "./gitOperations.js";

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

async function generateMessage(diff, type) {
  if (diff.length > MAX_DIFF_SIZE) {
    console.warn(
      `Diff is too large. Only the first 1MB will be used to generate the ${type} message.`
    );
    diff = diff.substring(0, MAX_DIFF_SIZE);
  }

  const aiProvider = getAIProviderInstance();
  const model = getAIModel();

  try {
    if (type === "commit") {
      return await aiProvider.generateCommitMessage(diff, model);
    } else if (type === "branch") {
      return await aiProvider.generateBranchName(diff, model);
    }
  } catch (error) {
    console.error(`Error generating ${type} message.`, error);
    return null;
  }
}

async function generateCommitMessage(diff) {
  return await generateMessage(diff, "commit");
}

async function generateBranchName(diff) {
  return await generateMessage(diff, "branch");
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
  const cleanedMessage = message
    .replace(/^["']|["']$/g, "")
    .replace(/'/g, "'\\''");
  exec(
    `git -C ${repoPath} commit -m '${cleanedMessage}'`,
    (error, stdout, stderr) => {
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
    }
  );
}

function promptBranchCreation(branchName) {
  inquirer
    .prompt([
      {
        type: "list",
        name: "prefix",
        message: "Select branch type.",
        choices: [
          "feat",
          "fix",
          "docs",
          "chore",
          "refactor",
          "no prefix needed",
        ],
      },
      {
        type: "list",
        name: "action",
        message: `Generated branch name:\n${branchName}\n\nWhat would you like to do?`,
        choices: ["Accept", "Edit", "Cancel"],
      },
    ])
    .then(async (answers) => {
      const prefix =
        answers.prefix === "no prefix needed" ? "" : `${answers.prefix}-`;
      const fullBranchName = `${prefix}${branchName}`;

      switch (answers.action) {
        case "Accept":
          try {
            await createAndCheckoutBranch(fullBranchName);
            console.log(`Branch created and switched to: ${fullBranchName}`);
          } catch (error) {
            console.error("Failed to create branch:", error.message);
          }
          break;
        case "Edit":
          inquirer
            .prompt([
              {
                type: "input",
                name: "editedName",
                message: "Edit branch name:",
                default: fullBranchName,
              },
            ])
            .then(async (editAnswer) => {
              try {
                await createAndCheckoutBranch(editAnswer.editedName);
                console.log(
                  `Branch created and switched to: ${editAnswer.editedName}`
                );
              } catch (error) {
                console.error("Failed to create branch:", error.message);
              }
            });
          break;
        case "Cancel":
          console.log("Branch creation cancelled.");
          break;
      }
    });
}

export {
  generateCommitMessage,
  promptCommit,
  generateBranchName,
  promptBranchCreation,
};
