import input from "@inquirer/input";
import select from "@inquirer/select";
import {
  getAIModel,
  getAIProvider,
  getApiKey,
  getBaseURL,
  getConfigValue,
  getLocale,
  getProviderMeta,
  listConfig,
  PROVIDERS,
  setConfig,
} from "./config.js";
import { commitChanges, createAndCheckoutBranch } from "./git.js";
import {
  buildMessages,
  chatCompletion,
  cleanCommitMessage,
  formatBranchName,
} from "./providers.js";

const DEFAULT_MAX_DIFF_CHARS = 32_000;
const BRANCH_PREFIXES = ["feat", "fix", "docs", "chore", "refactor", "none"];
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

async function withSpinner(label, fn) {
  if (!process.stdout.isTTY) {
    return await fn();
  }
  let idx = 0;
  const timer = setInterval(() => {
    process.stdout.write(
      `\r${SPINNER_FRAMES[idx % SPINNER_FRAMES.length]} ${label}`
    );
    idx += 1;
  }, 80);
  try {
    return await fn();
  } finally {
    clearInterval(timer);
    process.stdout.write("\r\x1b[2K");
  }
}

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

async function generateFromDiff(diff, type, options = {}) {
  const provider = getAIProvider();
  const meta = getProviderMeta(provider);
  const apiKey = getApiKey(provider);
  const model = getAIModel(provider);
  const baseURL = getBaseURL(provider);
  const locale = options.locale || getLocale();

  const messages = buildMessages(truncateDiff(diff), type, {
    locale,
    previousSuggestions: options.previousSuggestions,
    context: options.context,
  });

  const raw = await chatCompletion({
    baseURL,
    apiKey,
    model,
    messages,
    extraParams: meta.extraParams,
    protocol: meta.protocol,
  });

  return type === "branch" ? formatBranchName(raw) : cleanCommitMessage(raw);
}

function generateCommitMessage(diff, options = {}) {
  return generateFromDiff(diff, "commit", options);
}

function generateBranchName(diff, options = {}) {
  return generateFromDiff(diff, "branch", options);
}

function isPromptCancelled(error) {
  return error?.name === "ExitPromptError";
}

async function runSetupWizard() {
  try {
    const currentProvider = getAIProvider();
    const providerChoices = Object.entries(PROVIDERS).map(([name, info]) => ({
      name: `${name} (${info.defaultModel})`,
      value: name,
    }));

    const provider = await select({
      message: "Select AI provider:",
      choices: providerChoices,
      default: currentProvider,
    });

    setConfig("AI_PROVIDER", provider);
    const meta = getProviderMeta(provider);

    if (meta.requiresApiKey !== false) {
      const existingKey = getApiKey(provider);
      const apiKey = await input({
        message: existingKey
          ? `Enter ${meta.apiKeyName} (leave blank to keep existing):`
          : `Enter ${meta.apiKeyName}:`,
        validate: (val) =>
          val.trim() || existingKey ? true : `${meta.apiKeyName} is required.`,
      });
      if (apiKey.trim()) {
        setConfig(meta.apiKeyName, apiKey.trim());
      }
    }

    const model = await input({
      message: "Model name:",
      default: meta.defaultModel,
    });
    if (model.trim() && model.trim() !== meta.defaultModel) {
      setConfig("AI_MODEL", model.trim());
    }

    const locale = await select({
      message: "Commit message language:",
      choices: [
        { name: "English (en)", value: "en" },
        { name: "Simplified Chinese (zh)", value: "zh" },
      ],
      default: getLocale() === "zh" ? "zh" : "en",
    });
    setConfig("AI_LOCALE", locale);

    console.log("\nSetup complete. Active configuration:");
    for (const [key, value] of Object.entries(listConfig())) {
      console.log(`  ${key}: ${value}`);
    }
  } catch (error) {
    if (isPromptCancelled(error)) {
      console.log("\nSetup cancelled.");
      return;
    }
    throw error;
  }
}

async function promptCommit(diff, { autoAccept = false, context = "" } = {}) {
  const previousSuggestions = [];
  let commitMessage = await withSpinner("Generating commit message...", () =>
    generateCommitMessage(diff, { context })
  );

  if (autoAccept) {
    if (!commitMessage) {
      throw new Error("Failed to generate a commit message.");
    }
    console.log(`Commit message: ${commitMessage}`);
    const output = await commitChanges(commitMessage);
    console.log(output.trim());
    return;
  }

  try {
    while (commitMessage) {
      const action = await select({
        message: `Generated commit message:\n  ${commitMessage}\n\nWhat would you like to do?`,
        choices: [
          { value: "Accept" },
          { value: "Edit" },
          { value: "Regenerate" },
          { value: "Cancel" },
        ],
      });

      if (action === "Accept") {
        const output = await commitChanges(commitMessage);
        console.log(output.trim());
        return;
      }

      if (action === "Edit") {
        const editedMessage = await input({
          message: "Edit the commit message:",
          default: commitMessage,
          validate: (val) =>
            val.trim() ? true : "Commit message cannot be empty.",
        });
        const output = await commitChanges(editedMessage.trim());
        console.log(output.trim());
        return;
      }

      if (action === "Regenerate") {
        previousSuggestions.push(commitMessage);
        commitMessage = await withSpinner(
          "Regenerating commit message...",
          () => generateCommitMessage(diff, { previousSuggestions, context })
        );
        continue;
      }

      console.log("Commit cancelled.");
      return;
    }

    throw new Error("Failed to generate a commit message.");
  } catch (error) {
    if (isPromptCancelled(error)) {
      console.log("\nCommit cancelled.");
      return;
    }
    throw error;
  }
}

async function promptBranchCreation(diff, { context = "" } = {}) {
  const previousSuggestions = [];
  let slug = await withSpinner("Generating branch name...", () =>
    generateBranchName(diff, { context })
  );

  try {
    const prefix = await select({
      message: "Select branch prefix:",
      choices: BRANCH_PREFIXES.map((value) => ({ value })),
    });

    while (slug) {
      const fullBranchName = prefix === "none" ? slug : `${prefix}/${slug}`;

      const action = await select({
        message: `Generated branch name:\n  ${fullBranchName}\n\nWhat would you like to do?`,
        choices: [
          { value: "Accept" },
          { value: "Edit" },
          { value: "Regenerate" },
          { value: "Cancel" },
        ],
      });

      if (action === "Accept") {
        await createAndCheckoutBranch(fullBranchName);
        console.log(`Branch created and switched to: ${fullBranchName}`);
        return;
      }

      if (action === "Edit") {
        const editedName = await input({
          message: "Edit branch name:",
          default: fullBranchName,
          validate: (val) =>
            val.trim() ? true : "Branch name cannot be empty.",
        });
        await createAndCheckoutBranch(editedName.trim());
        console.log(`Branch created and switched to: ${editedName.trim()}`);
        return;
      }

      if (action === "Regenerate") {
        previousSuggestions.push(slug);
        slug = await withSpinner("Regenerating branch name...", () =>
          generateBranchName(diff, { previousSuggestions, context })
        );
        continue;
      }

      console.log("Branch creation cancelled.");
      return;
    }

    throw new Error("Failed to generate a branch name.");
  } catch (error) {
    if (isPromptCancelled(error)) {
      console.log("\nBranch creation cancelled.");
      return;
    }
    throw error;
  }
}

export {
  generateBranchName,
  generateCommitMessage,
  promptBranchCreation,
  promptCommit,
  runSetupWizard,
  truncateDiff,
};
