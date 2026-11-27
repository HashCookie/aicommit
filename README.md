<div align="center">
  <h1>aicommit</h1>
  <p>
    A lightweight CLI that generates Conventional Commits messages and branch
    names from staged git diffs using AI.
  </p>
  <p>
    <a href="https://www.npmjs.com/package/unique-aicommit"
      ><img
        src="https://img.shields.io/npm/v/unique-aicommit"
        alt="npm version"
      ></a
    >
    <a href="https://www.npmjs.com/package/unique-aicommit"
      ><img
        src="https://img.shields.io/npm/dt/unique-aicommit"
        alt="npm downloads"
      ></a
    >
    <img
      src="https://img.shields.io/badge/node-%3E%3D20-brightgreen"
      alt="node >= 20"
    >
  </p>
  <p><strong>English</strong> | <a href="./README.zh-CN.md">简体中文</a></p>
</div>

<div align="center">
  <img src="public/aicommit.jpg" alt="aicommit demo" width="720">
</div>

## Quick Start

Requires Node.js >= 20.

```sh
# 1. Install globally
npm install -g unique-aicommit

# 2. Configure a provider and API key (or use environment variables)
aicommit config set AI_PROVIDER=deepseek
aicommit config set DEEPSEEK_KEY=<your_api_key>

# 3. Stage your changes and generate a commit message
git add .
aicommit
```

## Usage

### Generate a commit message

```sh
git add <files...>
aicommit

# Skip confirmation and commit immediately
aicommit -y
```

Interactive actions:

- **Accept** — commit directly with the generated message
- **Edit** — modify the message before committing
- **Regenerate** — request a new suggestion
- **Cancel** — abort

### Generate and checkout a branch

```sh
aicommit branch
# shorthand
aicommit b
```

Pick a prefix (`feat`, `fix`, `docs`, `chore`, `refactor`, or `none`), preview the full branch name, and confirm to run `git checkout -b`.

## Supported Providers

If an API key is not set in `~/.aicommitrc`, `aicommit` falls back to the corresponding environment variable. If `AI_PROVIDER` is unset, it auto-detects the first provider with a configured key.

| Provider      | Default Model              | Config Key        | Env Fallback                        | Get Key                                                  |
| ------------- | -------------------------- | ----------------- | ----------------------------------- | -------------------------------------------------------- |
| `deepseek`    | `deepseek-chat`            | `DEEPSEEK_KEY`    | `DEEPSEEK_API_KEY`                  | [DeepSeek](https://platform.deepseek.com/)               |
| `moonshot`    | `moonshot-v1-8k`           | `MOONSHOT_KEY`    | `MOONSHOT_API_KEY`                  | [Moonshot](https://platform.moonshot.cn/)                |
| `siliconflow` | `Qwen/Qwen2.5-7B-Instruct` | `SILICONFLOW_KEY` | `SILICONFLOW_API_KEY`               | [SiliconFlow](https://cloud.siliconflow.cn/)             |
| `openai`      | `gpt-4o-mini`              | `OPENAI_KEY`      | `OPENAI_API_KEY`                    | [OpenAI](https://platform.openai.com/api-keys)           |
| `openrouter`  | `openai/gpt-4o-mini`       | `OPENROUTER_KEY`  | `OPENROUTER_API_KEY`                | [OpenRouter](https://openrouter.ai/keys)                 |
| `gemini`      | `gemini-2.0-flash`         | `GEMINI_KEY`      | `GEMINI_API_KEY` / `GOOGLE_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey)   |
| `groq`        | `llama-3.3-70b-versatile`  | `GROQ_KEY`        | `GROQ_API_KEY`                      | [Groq](https://console.groq.com/keys)                    |
| `anthropic`   | `claude-3-5-haiku-latest`  | `ANTHROPIC_KEY`   | `ANTHROPIC_API_KEY`                 | [Anthropic](https://console.anthropic.com/settings/keys) |
| `ollama`      | `llama3.2`                 | Not required      | -                                   | [Ollama](https://ollama.com/)                            |

### Local models with Ollama (no API key required)

```sh
aicommit config set AI_PROVIDER=ollama
aicommit config set AI_MODEL=llama3.2
```

### Custom OpenAI-compatible endpoints (OneAPI, LM Studio, proxies)

```sh
aicommit config set AI_BASE_URL=https://api.example.com/v1
aicommit config set AI_MODEL=<model_name>
```

## Configuration

Settings are stored in `~/.aicommitrc` with `0600` file permissions.

```sh
aicommit config list                     # Show active configuration (keys are masked)
aicommit config get <key>                # Read a single config value
aicommit config set <key>=<value>        # Set a config value
aicommit config unset <key>              # Remove a config value
```

Common options:

- `AI_PROVIDER` — active provider (automatically resets `AI_MODEL` to that provider's default)
- `AI_MODEL` — override the default model
- `AI_BASE_URL` — override the default API base URL
- `AI_LOCALE` — commit description language (default: `en`, e.g. `zh` for Simplified Chinese)
- `MAX_DIFF_CHARS` — maximum diff characters sent to the model (default: `32000`)

## Development

```sh
npm test
```

## License

ISC · Inspired by [aicommits](https://github.com/Nutlope/aicommits)
