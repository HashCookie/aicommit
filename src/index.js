#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  getApiKey,
  setConfig,
  getAIProvider,
  listConfig,
  getConfigValue,
  PROVIDER_CONFIGS,
} from "./config.js";
import {
  isGitRepository,
  checkStagedChanges,
  executeDiff,
} from "./gitOperations.js";
import {
  generateCommitMessage,
  promptCommit,
  generateBranchName,
  promptBranchCreation,
} from "./messageGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
);
const VERSION = packageJson.version;

const args = process.argv.slice(2);

async function handleConfig(command, key) {
  switch (command) {
    case "set":
      if (key) {
        const [configKey, configValue] = key.split("=");
        if (configValue) {
          setConfig(configKey, configValue);
          console.log(`${configKey} has been set up successfully.`);
        } else {
          console.log(
            "Invalid set command. Use the format: aicommit config set key=value"
          );
        }
      }
      break;
    case "get":
      if (key) {
        const value = getConfigValue(key);
        console.log(value ? `${key}: ${value}` : `${key} Not set.`);
      }
      break;
    case "list":
      const configs = listConfig();
      console.log("Current configuration:");
      Object.entries(configs).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
      break;
    default:
      console.log("Invalid config command. Available commands: set, get, list");
  }
}

async function checkApiKeyAndRepo() {
  const provider = getAIProvider();
  const apiKey = getApiKey();
  if (!apiKey) {
    const apiKeyName = PROVIDER_CONFIGS[provider].apiKeyName;
    console.error(
      `API key not set for ${provider}. Please use the following command to set it: 'aicommit config set ${apiKeyName}=<your key>'`
    );
    process.exit(1);
  }

  const isGitRepo = await isGitRepository();
  if (!isGitRepo) {
    console.log("Error: Current directory is not a Git repository.");
    console.log(
      "Please run 'aicommit' in the Git repository, or use 'git init' to initialize a repository."
    );
    process.exit(1);
  }

  const hasStaged = await checkStagedChanges();
  if (!hasStaged) {
    console.log(
      "Warning: No changes detected to commit. Please use 'git add' to stage your changes before committing."
    );
    console.log("After saving changes, run 'aicommit' again.");
    return false;
  }

  return true;
}

async function main() {
  if (args[0] === "--version") {
    console.log(`aicommit version ${VERSION}`);
    return;
  }

  if (args[0] === "config") {
    await handleConfig(args[1]?.toLowerCase(), args[2]?.toLowerCase());
    return;
  }

  if (args[0] === "branch" || args[0] === "b") {
    if (await checkApiKeyAndRepo()) {
      try {
        const diff = await executeDiff();
        if (diff) {
          const branchName = await generateBranchName(diff);
          if (branchName) {
            promptBranchCreation(branchName);
          } else {
            console.log("Failed to generate branch name. Please try again.");
          }
        }
      } catch (error) {
        console.error("Error:", error.message);
      }
    }
    return;
  }

  if (args.length === 0) {
    if (await checkApiKeyAndRepo()) {
      try {
        const diff = await executeDiff();
        if (diff) {
          const commitMessage = await generateCommitMessage(diff);
          if (commitMessage) {
            promptCommit(commitMessage);
          } else {
            console.log(
              "Failed to generate a commit message. Please try again."
            );
          }
        }
      } catch (error) {
        console.error("ERROR:", error.message);
      }
    }
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
