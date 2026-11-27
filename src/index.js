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
import {
  getStagedDiff,
  hasStagedChanges,
  isGitRepository,
  stageTrackedChanges,
} from "./git.js";
import {
  promptBranchCreation,
  promptCommit,
  runSetupWizard,
} from "./prompt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { version: VERSION } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
);

function printHelp() {
  const providers = Object.keys(PROVIDERS).join(", ");
  console.log(`aicommit v${VERSION}

Usage:
  aicommit [options]           Generate a commit message from staged changes
  aicommit branch | b [opts]   Generate and checkout a branch from staged changes
  aicommit setup               Interactive setup wizard for provider, key, and language
  aicommit config set <k>=<v>  Set a config value (AI_PROVIDER, AI_MODEL, AI_BASE_URL, AI_LOCALE, <PROVIDER>_KEY)
  aicommit config get <key>    Get a config value
  aicommit config unset <key>  Remove a config value
  aicommit config list         Show active configuration
  aicommit --version | -v      Show version
  aicommit --help | -h         Show help

Options:
  -a, --all                    Stage modified tracked files before generating (git add -u)
  -y, --yes                    Skip confirmation prompt and commit immediately
  -c, --context <text>         Provide extra context/hint for the AI

Supported providers: ${providers}`);
}

function parseFlags(tokens) {
  const flags = { all: false, yes: false, context: "" };
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === "-a" || token === "--all") {
      flags.all = true;
    } else if (token === "-y" || token === "--yes") {
      flags.yes = true;
    } else if (token === "-ay" || token === "-ya") {
      flags.all = true;
      flags.yes = true;
    } else if (token === "-c" || token === "--context") {
      const value = tokens[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(`Option "${token}" requires a value.`);
      }
      flags.context = value;
      i += 1;
    } else {
      throw new Error(`Unknown command or option: "${token}"`);
    }
  }
  return flags;
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

async function ensureReadyAndGetDiff({ stageAll = false } = {}) {
  const provider = getAIProvider();
  const meta = getProviderMeta(provider);
  const apiKey = getApiKey(provider);
  if (meta.requiresApiKey !== false && !apiKey) {
    const envHint = meta.envKeys?.length
      ? ` or export ${meta.envKeys[0]}=<your_key>`
      : "";
    console.error(
      `API key not set for "${provider}". Run 'aicommit setup' or:\n  aicommit config set ${meta.apiKeyName}=<your_key>${envHint}`
    );
    process.exit(1);
  }

  if (!(await isGitRepository())) {
    console.error("Error: Current directory is not a Git repository.");
    process.exit(1);
  }

  if (stageAll) {
    await stageTrackedChanges();
  }

  if (!(await hasStagedChanges())) {
    console.log(
      "No staged changes found. Stage files with 'git add' or pass '-a'."
    );
    return null;
  }

  const diff = await getStagedDiff();
  if (!diff) {
    console.log(
      "Only ignored lockfiles or generated assets are staged. Nothing to summarize."
    );
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

  if (command === "setup") {
    await runSetupWizard();
    return;
  }

  if (command === "config") {
    handleConfig(rest[0], rest[1]);
    return;
  }

  if (command === "branch" || command === "b") {
    const flags = parseFlags(rest);
    const diff = await ensureReadyAndGetDiff({ stageAll: flags.all });
    if (diff) {
      await promptBranchCreation(diff, { context: flags.context });
    }
    return;
  }

  const flags = parseFlags(args);
  const diff = await ensureReadyAndGetDiff({ stageAll: flags.all });
  if (diff) {
    await promptCommit(diff, {
      autoAccept: flags.yes,
      context: flags.context,
    });
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  if (error.message.startsWith("Unknown command")) {
    console.log("");
    printHelp();
  }
  process.exit(1);
});
