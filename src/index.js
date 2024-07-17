#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  getApiKey,
  setConfig,
  getModel,
  listConfig,
  getConfigValue,
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
      console.log(`${configKey} has been set successfully.`);
    } else {
      console.log(
        "Invalid set command. Use format: aicommit config set KEY=VALUE"
      );
    }
  } else if (command === "get" && key) {
    const value = getConfigValue(key);
    if (value) {
      console.log(`${key}: ${value}`);
    } else {
      console.log(`${key} is not set.`);
    }
  } else if (command === "list") {
    const configs = listConfig();
    console.log("Current configurations:");
    Object.entries(configs).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  } else {
    console.log("Invalid config command. Available commands: set, get, list");
  }
  process.exit(0);
}

if (args.length === 0) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error(
      "API key is not set. Please set it using: aicommit config set DeepSeek_KEY=<your token>"
    );
    process.exit(1);
  }

  isGitRepository()
    .then((isGitRepo) => {
      if (!isGitRepo) {
        console.log("Error: The current directory is not a Git repository.");
        console.log(
          "Please run 'aicommit' in a Git repository or initialize one with 'git init'."
        );
        process.exit(1);
      }
      return checkStagedChanges();
    })
    .then((hasStaged) => {
      if (!hasStaged) {
        console.log(
          "Warning: No staged changes found. Please use 'git add' to stage your changes before committing."
        );
        console.log("After staging your changes, run 'aicommit' again.");
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
        console.log("Failed to generate commit message. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
