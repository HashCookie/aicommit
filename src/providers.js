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

const PROMPTS = {
  commit:
    "You are a commit message generator. Generate a concise single-line commit message following the Conventional Commits specification (e.g. 'feat: add user login'). Output ONLY the commit message with no quotes, markdown fences, or explanation.",
  branch:
    "You are a branch name generator. Generate a concise slug (max 5 words) summarizing the changes. Output ONLY lowercase letters, numbers, and hyphens with no prefix, quotes, or explanation.",
};

function buildMessages(diff, type = "commit") {
  const systemPrompt = PROMPTS[type];
  if (!systemPrompt) {
    throw new Error(`Unknown message type: ${type}`);
  }
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: diff },
  ];
}

function cleanCommitMessage(raw) {
  return (
    raw
      .trim()
      .replace(/^```[\w-]*\n?/g, "")
      .replace(/\n?```$/g, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean)
      ?.replace(/^["'`]+|["'`]+$/g, "")
      .trim() ?? ""
  );
}

function formatBranchName(raw) {
  return raw
    .trim()
    .replace(/^```[\w-]*\n?/g, "")
    .replace(/\n?```$/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
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
    const normalizedBase = baseURL.replace(/\/+$/, "");

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
      throw new Error(`API request timed out after ${timeoutMs / 1000}s.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export {
  PROVIDERS,
  DEFAULT_PROVIDER,
  buildMessages,
  cleanCommitMessage,
  formatBranchName,
  chatCompletion,
};
