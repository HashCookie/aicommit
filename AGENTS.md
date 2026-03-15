# AGENTS.md

## Cursor Cloud specific instructions

### Overview

`unique-aicommit` (aka `aicommit`) is a Node.js CLI tool that generates standardized git commit messages and branch names using AI (DeepSeek, Moonshot, or Deepbricks). It is a single-package project with no build step, no test framework, and no linting configuration.

### Running the CLI

- Run directly: `node src/index.js` or `npm start`
- After global install (`npm install -g .`): use the `aicommit` command
- Key commands: `aicommit --version`, `aicommit config set/get/list`, `aicommit`, `aicommit branch`

### Dependencies

- Package manager: **yarn** (lockfile: `yarn.lock`)
- Install: `yarn install`
- Runtime deps: `axios`, `inquirer`

### Important notes

- **No test framework or lint tooling** is configured in this repository. There are no automated tests to run and no lint commands available.
- **No build step** — pure ES modules (`"type": "module"` in `package.json`), runs directly with Node.js.
- **Requires an AI API key** for core functionality. Configure via `aicommit config set DEEPSEEK_KEY=<key>` (or `MOONSHOT_KEY` / `DEEPBRICKS_KEY`). Config is stored in `~/.aicommitrc`.
- The CLI is interactive (uses `inquirer` for prompts), so it cannot be fully tested non-interactively. Use `--version` and `config` subcommands for non-interactive verification.
- The CLI must be run inside a git repository with staged changes to generate commit messages or branch names.
