#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  getApiKey,
  setConfig,
  getAIProvider,
  getAIModel,
  listConfig,
  getConfigValue,
  PROVIDER_CONFIGS,
} = require("./config");
const {
  isGitRepository,
  checkStagedChanges,
  executeDiff,
} = require("./gitOperations");
const { generateCommitMessage, promptCommit } = require("./messageGenerator");

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
);
const VERSION = packageJson.version;

const args = process.argv.slice(2);

if (args[0] === "--version") {
  console.log(`aicommit version ${VERSION}`);
  process.exit(0);
}

if (args[0] === "config") {
  const command = args[1]?.toLowerCase();
  const key = args[2]?.toLowerCase();

  if (command === "set" && args[2]) {
    const [configKey, configValue] = args[2].split("=");
    if (configValue) {
      setConfig(configKey, configValue);
      console.log(`${configKey} has been set up successfully.`);
    } else {
      console.log(
        "Invalid set command. Use the format: aicommit config set key=value"
      );
    }
  } else if (command === "get" && key) {
    const value = getConfigValue(key);
    if (value) {
      console.log(`${key}: ${value}`);
    } else {
      console.log(`${key} Not set.`);
    }
  } else if (command === "list") {
    const configs = listConfig();
    console.log("Current configuration:");
    Object.entries(configs).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  } else {
    console.log("Invalid config command. Available commands: set, get, list");
  }
  process.exit(0);
}

if (args.length === 0) {
  const provider = getAIProvider();
  const apiKey = getApiKey();
  if (!apiKey) {
    const apiKeyName = PROVIDER_CONFIGS[provider].apiKeyName;
    console.error(
      `API key not set for ${provider}. Please use the following command to set it: 'aicommit config set ${apiKeyName}=<your key>'`
    );
    process.exit(1);
  }

  isGitRepository()
    .then((isGitRepo) => {
      if (!isGitRepo) {
        console.log("Error: Current directory is not a Git repository.");
        console.log(
          "Please run 'aicommit' in the Git repository, or use 'git init' to initialize a repository."
        );
        process.exit(1);
      }
      return checkStagedChanges();
    })
    .then((hasStaged) => {
      if (!hasStaged) {
        console.log(
          "Warning: No changes detected to commit. Please use 'git add' to stage your changes before committing."
        );
        console.log("After saving changes, run 'aicommit' again.");
        return;
      }
      return executeDiff();
    })
    .then((diff) => {
      if (diff) {
        return generateCommitMessage(diff);
      }
    })
    .then((commitMessage) => {
      if (commitMessage) {
        promptCommit(commitMessage);
      } else {
        console.log("Failed to generate a commit message. Please try again.");
      }
    })
    .catch((error) => {
      console.error("ERROR:", error);
    });
}
