const PROVIDERS = {
  deepseek: {
    baseURL: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    apiKeyName: "DEEPSEEK_KEY",
    envKeys: ["DEEPSEEK_API_KEY", "DEEPSEEK_KEY"],
    protocol: "openai",
  },
  moonshot: {
    baseURL: "https://api.moonshot.cn/v1",
    defaultModel: "moonshot-v1-8k",
    apiKeyName: "MOONSHOT_KEY",
    envKeys: ["MOONSHOT_API_KEY", "MOONSHOT_KEY"],
    extraParams: { temperature: 0.3 },
    protocol: "openai",
  },
  siliconflow: {
    baseURL: "https://api.siliconflow.cn/v1",
    defaultModel: "Qwen/Qwen2.5-7B-Instruct",
    apiKeyName: "SILICONFLOW_KEY",
    envKeys: ["SILICONFLOW_API_KEY", "SILICONFLOW_KEY"],
    protocol: "openai",
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    apiKeyName: "OPENAI_KEY",
    envKeys: ["OPENAI_API_KEY", "OPENAI_KEY"],
    protocol: "openai",
  },
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    apiKeyName: "OPENROUTER_KEY",
    envKeys: ["OPENROUTER_API_KEY", "OPENROUTER_KEY"],
    protocol: "openai",
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    apiKeyName: "GEMINI_KEY",
    envKeys: ["GEMINI_API_KEY", "GOOGLE_API_KEY", "GEMINI_KEY"],
    protocol: "openai",
  },
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    apiKeyName: "GROQ_KEY",
    envKeys: ["GROQ_API_KEY", "GROQ_KEY"],
    protocol: "openai",
  },
  ollama: {
    baseURL: "http://localhost:11434/v1",
    defaultModel: "llama3.2",
    apiKeyName: "OLLAMA_KEY",
    envKeys: ["OLLAMA_API_KEY"],
    requiresApiKey: false,
    protocol: "openai",
  },
  anthropic: {
    baseURL: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-haiku-latest",
    apiKeyName: "ANTHROPIC_KEY",
    envKeys: ["ANTHROPIC_API_KEY", "ANTHROPIC_KEY"],
    protocol: "anthropic",
  },
};

const DEFAULT_PROVIDER = "deepseek";
const DEFAULT_TIMEOUT_MS = 30_000;
const ANTHROPIC_VERSION = "2023-06-01";
const BRANCH_PREFIX_RE =
  /^(?:feat|fix|docs|chore|refactor|hotfix|bugfix|style|perf|test|build|ci)-/u;
const THINK_TAG_RE = /<think>[\s\S]*?<\/think>/giu;
const FENCE_START_RE = /^```[\w-]*\n?/gu;
const FENCE_END_RE = /\n?```$/gu;
const LINE_SPLIT_RE = /\r?\n/u;
const SURROUNDING_QUOTES_RE = /^["'`]+|["'`]+$/gu;
const TRAILING_PERIOD_RE = /[.。]+$/u;
const NON_SLUG_CHARS_RE = /[^a-z0-9\s-]/gu;
const WHITESPACE_RE = /\s+/gu;
const MULTI_HYPHEN_RE = /-+/gu;
const EDGE_HYPHEN_RE = /^-|-$/gu;
const TRAILING_HYPHEN_RE = /-$/u;
const TRAILING_SLASH_RE = /\/+$/u;

function getCommitSystemPrompt(locale = "en") {
  const normalized = (locale || "en").toLowerCase();
  if (
    normalized === "zh" ||
    normalized === "zh-cn" ||
    normalized === "zh-hans"
  ) {
    return `Write a single-line Conventional Commit message for the staged git diff.
Types (keep <type> in English, choose the most accurate one):
- feat: new user-facing feature | fix: bug fix | refactor: restructuring or dependency swap without behavior change | docs: docs only | test: tests | perf: performance | style: formatting | build/ci/chore: maintenance
Rules:
- Format: <type>: <concise Simplified Chinese description> (under 50 chars, no trailing period)
- Summarize the intent, do not list file names
- Output ONLY the commit message, nothing else`;
  }

  const langRule =
    normalized === "en"
      ? "- Imperative mood, start description lowercase, keep proper nouns capitalized (e.g. README, API), no trailing period"
      : `- Keep <type> in English, write <description> in concise ${locale}, no trailing period`;

  return `Write a single-line Conventional Commit message for the staged git diff.
Types (choose the most accurate one):
- feat: new user-facing feature
- fix: bug fix
- refactor: code restructuring or dependency swap without changing external behavior
- docs: documentation only
- test: adding or updating tests
- perf: performance improvement
- style: formatting only
- build/ci/chore: build config, CI, or maintenance
Rules:
- Format: <type>: <description> (under 72 chars total)
${langRule}
- Summarize the intent, do not list file names
- Output ONLY the commit message, nothing else`;
}

const BRANCH_SYSTEM_PROMPT = `Write a short git branch slug summarizing the intent of the staged diff.
Rules:
- 2 to 4 lowercase words joined by hyphens (a-z, 0-9, -), e.g. replace-axios-with-fetch, preserve-api-key-case
- Describe the intent, NEVER include file names or extensions (no js, json, md)
- Do NOT include prefixes like feat, fix, docs, chore, refactor
- Output ONLY the slug, nothing else`;

function buildMessages(diff, type = "commit", options = {}) {
  const { locale = "en", previousSuggestions = [], context = "" } = options;
  let systemPrompt;
  if (type === "commit") {
    systemPrompt = getCommitSystemPrompt(locale);
  } else if (type === "branch") {
    systemPrompt = BRANCH_SYSTEM_PROMPT;
  } else {
    throw new Error(`Unknown message type: ${type}`);
  }

  const userContent = context.trim()
    ? `Additional context from the author: ${context.trim()}\n\n${diff}`
    : diff;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  if (previousSuggestions.length > 0) {
    messages.push({
      role: "assistant",
      content: previousSuggestions.at(-1),
    });
    const list = previousSuggestions.map((s) => `- ${s}`).join("\n");
    messages.push({
      role: "user",
      content: `Generate a different alternative ${type === "branch" ? "branch slug" : "commit message"} for the same diff. Do not repeat any of these previous suggestions:\n${list}`,
    });
  }

  return messages;
}

function stripThinkingTags(raw) {
  return raw.replace(THINK_TAG_RE, "").trim();
}

function cleanCommitMessage(raw) {
  return (
    stripThinkingTags(raw)
      .replace(FENCE_START_RE, "")
      .replace(FENCE_END_RE, "")
      .split(LINE_SPLIT_RE)
      .map((line) => line.trim())
      .find(Boolean)
      ?.replace(SURROUNDING_QUOTES_RE, "")
      .replace(TRAILING_PERIOD_RE, "")
      .trim() ?? ""
  );
}

function formatBranchName(raw, { stripPrefix = true } = {}) {
  let slug = stripThinkingTags(raw)
    .replace(FENCE_START_RE, "")
    .replace(FENCE_END_RE, "")
    .toLowerCase()
    .replace(NON_SLUG_CHARS_RE, "")
    .replace(WHITESPACE_RE, "-")
    .replace(MULTI_HYPHEN_RE, "-")
    .replace(EDGE_HYPHEN_RE, "");

  if (stripPrefix) {
    slug = slug.replace(BRANCH_PREFIX_RE, "");
  }

  return slug.slice(0, 50).replace(TRAILING_HYPHEN_RE, "");
}

async function parseErrorDetail(response) {
  try {
    const body = await response.json();
    return body?.error?.message || body?.message || JSON.stringify(body);
  } catch {
    return response.statusText;
  }
}

async function chatCompletion({
  baseURL,
  apiKey,
  model,
  messages,
  extraParams = {},
  protocol = "openai",
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = fetch,
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const normalizedBase = baseURL.replace(TRAILING_SLASH_RE, "");

    if (protocol === "anthropic") {
      const systemMsg = messages.find((m) => m.role === "system")?.content;
      const userMessages = messages.filter((m) => m.role !== "system");
      const response = await fetchImpl(`${normalizedBase}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 256,
          ...(systemMsg ? { system: systemMsg } : {}),
          messages: userMessages,
          ...extraParams,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await parseErrorDetail(response);
        throw new Error(`API request failed (${response.status}): ${detail}`);
      }

      const data = await response.json();
      const textBlock = data?.content?.find((b) => b.type === "text")?.text;
      if (typeof textBlock !== "string" || !textBlock.trim()) {
        throw new Error("API returned an empty response.");
      }
      return textBlock.trim();
    }

    const headers = { "Content-Type": "application/json" };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetchImpl(`${normalizedBase}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        ...extraParams,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await parseErrorDetail(response);
      throw new Error(`API request failed (${response.status}): ${detail}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("API returned an empty response.");
    }

    return content.trim();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`API request timed out after ${timeoutMs / 1000}s.`, {
        cause: error,
      });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export {
  buildMessages,
  chatCompletion,
  cleanCommitMessage,
  DEFAULT_PROVIDER,
  formatBranchName,
  PROVIDERS,
};
