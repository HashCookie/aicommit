# AGENTS.md

## Cursor Cloud specific instructions

This is a Node.js CLI tool (`aicommit`) that uses AI APIs to generate git commit messages and branch names from staged changes.

### Project overview

- **Package manager:** yarn (lockfile: `yarn.lock`)
- **Runtime:** Node.js (ES modules, `"type": "module"`)
- **Entry point:** `src/index.js` (CLI binary: `aicommit`)
- **No build step** — plain JavaScript, runs directly with `node`
- **No test framework or lint configuration** — the codebase has no automated tests or linting

### Running the CLI

```sh
node src/index.js --version          # check version
node src/index.js config list        # list config
node src/index.js config set KEY=VAL # set config
npm start                            # alias for node src/index.js
```

### Configuration

Config is stored in `~/.aicommitrc` (JSON). Key settings:
- `AI_PROVIDER` — one of `deepseek`, `moonshot`, `deepbricks`
- `DEEPSEEK_KEY` / `MOONSHOT_KEY` / `DEEPBRICKS_KEY` — API key for the selected provider
- `AI_MODEL` — auto-set when provider is changed

### Key caveats

- The CLI is interactive (uses `inquirer`) — avoid running it in non-TTY contexts without handling that.
- A valid AI provider API key is required for commit/branch generation. Without one, the tool exits with an error.
- The first time `config set` is run, a harmless "Error reading config file" message appears because `~/.aicommitrc` doesn't exist yet — this is expected and the file is created automatically.
