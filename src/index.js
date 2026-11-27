#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  getAIProvider,
  getApiKey,
  getConfigValue,
  getProviderMeta,
  listConfig,
  PROVIDERS,
  parseKeyValue,
  setConfig,
  unsetConfig,
} from "./config.js";
import { getStagedDiff, hasStagedChanges, isGitRepository } from "./git.js";
import { promptBranchCreation, promptCommit } from "./prompt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { version: VERSION } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
);

function printHelp() {
  const providers = Object.keys(PROVIDERS).join(", ");
  console.log(`aicommit v${VERSION}

Usage:
  aicommit [-y | --yes]        Generate a commit message from staged changes (-y skips prompt)
  aicommit branch | b          Generate and checkout a branch from staged changes
  aicommit config set <k>=<v>  Set a config value (AI_PROVIDER, AI_MODEL, AI_BASE_URL, AI_LOCALE, <PROVIDER>_KEY)
  aicommit config get <key>    Get a config value
  aicommit config unset <key>  Remove a config value
  aicommit config list         Show active configuration
  aicommit --version | -v      Show version
  aicommit --help | -h         Show help

Supported providers: ${providers}`);
}

function handleConfig(subcommand, rawArg) {
  switch (subcommand?.toLowerCase()) {
    case "set": {
      const parsed = parseKeyValue(rawArg);
      if (!parsed) {
        console.error("Invalid format. Usage: aicommit config set key=value");
        process.exit(1);
      }
      const { key } = setConfig(parsed.key, parsed.value);
      console.log(`${key} has been set.`);
      break;
    }
    case "get": {
      if (!rawArg) {
        console.error("Usage: aicommit config get <key>");
        process.exit(1);
      }
      const value = getConfigValue(rawArg);
      console.log(
        value === undefined ? `${rawArg}: Not set` : `${rawArg}: ${value}`
      );
      break;
    }
    case "unset": {
      if (!rawArg) {
        console.error("Usage: aicommit config unset <key>");
        process.exit(1);
      }
      const removed = unsetConfig(rawArg);
      console.log(removed ? `${rawArg} removed.` : `${rawArg} was not set.`);
      break;
    }
    case "list": {
      const configs = listConfig();
      console.log("Current configuration:");
      for (const [key, value] of Object.entries(configs)) {
        console.log(`  ${key}: ${value}`);
      }
      break;
    }
    default:
      console.error("Invalid config command. Available: set, get, unset, list");
      process.exit(1);
  }
}

async function ensureReadyAndGetDiff() {
  const provider = getAIProvider();
  const meta = getProviderMeta(provider);
  const apiKey = getApiKey(provider);
  if (meta.requiresApiKey !== false && !apiKey) {
    const envHint = meta.envKeys?.length
      ? ` or export ${meta.envKeys[0]}=<your_key>`
      : "";
    console.error(
      `API key not set for "${provider}". Run:\n  aicommit config set ${meta.apiKeyName}=<your_key>${envHint}`
    );
    process.exit(1);
  }

  if (!(await isGitRepository())) {
    console.error("Error: Current directory is not a Git repository.");
    process.exit(1);
  }

  if (!(await hasStagedChanges())) {
    console.log("No staged changes found. Stage files with 'git add' first.");
    return null;
  }

  const diff = await getStagedDiff();
  if (!diff) {
    console.log("Only ignored lockfiles are staged. Nothing to summarize.");
    return null;
  }

  return diff;
}

async function main() {
  const args = process.argv.slice(2);
  const [command, ...rest] = args;

  if (command === "--version" || command === "-v") {
    console.log(`aicommit v${VERSION}`);
    return;
  }

  if (command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "config") {
    handleConfig(rest[0], rest[1]);
    return;
  }

  if (command === "branch" || command === "b") {
    const diff = await ensureReadyAndGetDiff();
    if (diff) {
      await promptBranchCreation(diff);
    }
    return;
  }

  if (!command || command === "-y" || command === "--yes") {
    const autoAccept = command === "-y" || command === "--yes";
    const diff = await ensureReadyAndGetDiff();
    if (diff) {
      await promptCommit(diff, { autoAccept });
    }
    return;
  }

  console.error(`Unknown command: "${command}"\n`);
  printHelp();
  process.exit(1);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
