const PROVIDERS = {
  deepseek: {
    baseURL: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    apiKeyName: "DEEPSEEK_KEY",
  },
  moonshot: {
    baseURL: "https://api.moonshot.cn/v1",
    defaultModel: "moonshot-v1-8k",
    apiKeyName: "MOONSHOT_KEY",
    extraParams: { temperature: 0.3 },
  },
  siliconflow: {
    baseURL: "https://api.siliconflow.cn/v1",
    defaultModel: "Qwen/Qwen2.5-7B-Instruct",
    apiKeyName: "SILICONFLOW_KEY",
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    apiKeyName: "OPENAI_KEY",
  },
};

const DEFAULT_PROVIDER = "deepseek";
const DEFAULT_TIMEOUT_MS = 30_000;

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
  return raw
    .trim()
    .replace(/^```[\w-]*\n?/g, "")
    .replace(/\n?```$/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
    ?.replace(/^["'`]+|["'`]+$/g, "")
    .trim() ?? "";
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

async function chatCompletion({
  baseURL,
  apiKey,
  model,
  messages,
  extraParams = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = fetch,
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = `${baseURL.replace(/\/+$/, "")}/chat/completions`;
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        ...extraParams,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const body = await response.json();
        detail = body?.error?.message || body?.message || JSON.stringify(body);
      } catch {
        // fallback to statusText
      }
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
