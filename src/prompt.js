import inquirer from "inquirer";
import {
  getAIProvider,
  getProviderMeta,
  getApiKey,
  getAIModel,
  getBaseURL,
  getConfigValue,
} from "./config.js";
import {
  buildMessages,
  cleanCommitMessage,
  formatBranchName,
  chatCompletion,
} from "./providers.js";
import { commitChanges, createAndCheckoutBranch } from "./git.js";

const DEFAULT_MAX_DIFF_CHARS = 32_000;
const BRANCH_PREFIXES = ["feat", "fix", "docs", "chore", "refactor", "none"];

function truncateDiff(diff) {
  const configuredMax = Number(getConfigValue("MAX_DIFF_CHARS"));
  const maxChars =
    Number.isFinite(configuredMax) && configuredMax > 0
      ? configuredMax
      : DEFAULT_MAX_DIFF_CHARS;

  if (diff.length <= maxChars) {
    return diff;
  }

  console.warn(
    `Warning: Diff is ${diff.length} chars; truncating to the first ${maxChars} chars.`
  );
  return diff.slice(0, maxChars);
}

async function generateFromDiff(diff, type) {
  const provider = getAIProvider();
  const meta = getProviderMeta(provider);
  const apiKey = getApiKey(provider);
  const model = getAIModel(provider);
  const baseURL = getBaseURL(provider);

  const messages = buildMessages(truncateDiff(diff), type);
  const raw = await chatCompletion({
    baseURL,
    apiKey,
    model,
    messages,
    extraParams: meta.extraParams,
  });

  return type === "branch" ? formatBranchName(raw) : cleanCommitMessage(raw);
}

async function generateCommitMessage(diff) {
  return await generateFromDiff(diff, "commit");
}

async function generateBranchName(diff) {
  return await generateFromDiff(diff, "branch");
}

async function promptCommit(diff) {
  let commitMessage = await generateCommitMessage(diff);

  while (true) {
    if (!commitMessage) {
      throw new Error("Failed to generate a commit message.");
    }

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: `Generated commit message:\n  ${commitMessage}\n\nWhat would you like to do?`,
        choices: ["Accept", "Edit", "Regenerate", "Cancel"],
      },
    ]);

    if (action === "Accept") {
      const output = await commitChanges(commitMessage);
      console.log(output.trim());
      return;
    }

    if (action === "Edit") {
      const { editedMessage } = await inquirer.prompt([
        {
          type: "input",
          name: "editedMessage",
          message: "Edit the commit message:",
          default: commitMessage,
          validate: (input) =>
            input.trim() ? true : "Commit message cannot be empty.",
        },
      ]);
      const output = await commitChanges(editedMessage.trim());
      console.log(output.trim());
      return;
    }

    if (action === "Regenerate") {
      console.log("Regenerating commit message...");
      commitMessage = await generateCommitMessage(diff);
      continue;
    }

    console.log("Commit cancelled.");
    return;
  }
}

async function promptBranchCreation(diff) {
  let slug = await generateBranchName(diff);

  const { prefix } = await inquirer.prompt([
    {
      type: "list",
      name: "prefix",
      message: "Select branch prefix:",
      choices: BRANCH_PREFIXES,
    },
  ]);

  while (true) {
    if (!slug) {
      throw new Error("Failed to generate a branch name.");
    }

    const fullBranchName = prefix === "none" ? slug : `${prefix}/${slug}`;

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: `Generated branch name:\n  ${fullBranchName}\n\nWhat would you like to do?`,
        choices: ["Accept", "Edit", "Regenerate", "Cancel"],
      },
    ]);

    if (action === "Accept") {
      await createAndCheckoutBranch(fullBranchName);
      console.log(`Branch created and switched to: ${fullBranchName}`);
      return;
    }

    if (action === "Edit") {
      const { editedName } = await inquirer.prompt([
        {
          type: "input",
          name: "editedName",
          message: "Edit branch name:",
          default: fullBranchName,
          validate: (input) =>
            input.trim() ? true : "Branch name cannot be empty.",
        },
      ]);
      await createAndCheckoutBranch(editedName.trim());
      console.log(`Branch created and switched to: ${editedName.trim()}`);
      return;
    }

    if (action === "Regenerate") {
      console.log("Regenerating branch name...");
      slug = await generateBranchName(diff);
      continue;
    }

    console.log("Branch creation cancelled.");
    return;
  }
}

export {
  truncateDiff,
  generateCommitMessage,
  generateBranchName,
  promptCommit,
  promptBranchCreation,
};
