import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

import {
  getAIModel,
  getAIProvider,
  getApiKey,
  getConfigValue,
  listConfig,
  maskSecret,
  parseKeyValue,
  setConfig,
  unsetConfig,
} from "../src/config.js";
import {
  commitChanges,
  createAndCheckoutBranch,
  getStagedDiff,
  hasStagedChanges,
  isGitRepository,
  parseNameStatus,
} from "../src/git.js";
import {
  buildMessages,
  chatCompletion,
  cleanCommitMessage,
  formatBranchName,
} from "../src/providers.js";

function withTempConfig(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aicommit-cfg-"));
  const cfgPath = path.join(dir, ".aicommitrc");
  const prev = process.env.AICOMMIT_CONFIG_PATH;
  process.env.AICOMMIT_CONFIG_PATH = cfgPath;
  try {
    return fn(cfgPath);
  } finally {
    if (prev === undefined) {
      delete process.env.AICOMMIT_CONFIG_PATH;
    } else {
      process.env.AICOMMIT_CONFIG_PATH = prev;
    }
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("parseKeyValue preserves case and '=' characters in value", () => {
  assert.deepEqual(parseKeyValue("DeepSeek_KEY=sk-AbCd==123"), {
    key: "DeepSeek_KEY",
    value: "sk-AbCd==123",
  });
  assert.equal(parseKeyValue("INVALID"), null);
  assert.equal(parseKeyValue("=value"), null);
  assert.equal(parseKeyValue("KEY="), null);
});

test("config read/write handles missing file, preserves key case, and auto-detects provider", () => {
  withTempConfig((cfgPath) => {
    // Missing config file should not throw
    assert.equal(getConfigValue("SILICONFLOW_KEY"), undefined);
    assert.equal(getAIProvider(), "deepseek");

    // Preserve exact case of API key
    setConfig("siliconflow_key", "sk-MixedCaseToken1234");
    assert.equal(getConfigValue("SILICONFLOW_KEY"), "sk-MixedCaseToken1234");

    // Auto-detect siliconflow when AI_PROVIDER is unset and deepseek key is missing
    assert.equal(getAIProvider(), "siliconflow");
    assert.equal(getApiKey(), "sk-MixedCaseToken1234");

    // File permissions should be 0600 on POSIX
    if (process.platform !== "win32") {
      const mode = fs.statSync(cfgPath).mode % 0o1000;
      assert.equal(mode, 0o600);
    }

    // Setting AI_PROVIDER updates default model
    setConfig("ai_provider", "moonshot");
    assert.equal(getAIProvider(), "moonshot");
    assert.equal(getAIModel(), "moonshot-v1-8k");

    // Invalid provider throws
    assert.throws(
      () => setConfig("AI_PROVIDER", "unknown"),
      /Unsupported AI_PROVIDER/u
    );

    // Masking and unset
    assert.equal(maskSecret("sk-1234567890abcd"), "sk-1...abcd");
    assert.equal(maskSecret("short"), "****");
    assert.equal(listConfig().AI_PROVIDER, "moonshot");
    assert.equal(unsetConfig("AI_PROVIDER"), true);
    assert.equal(unsetConfig("AI_PROVIDER"), false);
  });
});

test("cleanCommitMessage and formatBranchName sanitize model outputs", () => {
  assert.equal(
    cleanCommitMessage('```\n"feat: add retry logic."\n```'),
    "feat: add retry logic"
  );
  assert.equal(
    cleanCommitMessage(
      "<think>internal reasoning</think>\nfix: handle empty diff\n\nExtra explanation"
    ),
    "fix: handle empty diff"
  );
  assert.equal(
    formatBranchName("```\nAdd User Login & OAuth2!\n```"),
    "add-user-login-oauth2"
  );
  assert.equal(
    formatBranchName("<think>hmm</think>\nfeat-add-login"),
    "add-login"
  );
});

test("buildMessages supports locale and regenerate deduplication", () => {
  const zhMsgs = buildMessages("diff", "commit", { locale: "zh" });
  assert.match(zhMsgs[0].content, /Simplified Chinese/u);

  const regenMsgs = buildMessages("diff", "commit", {
    locale: "en",
    previousSuggestions: ["fix: first try", "refactor: second try"],
  });
  assert.equal(regenMsgs.length, 4);
  assert.equal(regenMsgs[2].role, "assistant");
  assert.equal(regenMsgs[2].content, "refactor: second try");
  assert.match(regenMsgs[3].content, /fix: first try/u);
  assert.match(regenMsgs[3].content, /refactor: second try/u);
});

test("chatCompletion sends OpenAI-compatible payload and handles HTTP errors", async () => {
  let captured;
  const mockFetch = async (url, init) => {
    captured = { url, init, body: JSON.parse(init.body) };
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "feat: add tests" } }],
      }),
    };
  };

  const result = await chatCompletion({
    baseURL: "https://example.com/v1/",
    apiKey: "sk-TestKey",
    model: "test-model",
    messages: buildMessages("diff --git a/a.js b/a.js", "commit"),
    fetchImpl: mockFetch,
  });

  assert.equal(result, "feat: add tests");
  assert.equal(captured.url, "https://example.com/v1/chat/completions");
  assert.equal(captured.init.headers.Authorization, "Bearer sk-TestKey");
  assert.equal(captured.body.model, "test-model");

  const errorFetch = async () => ({
    ok: false,
    status: 401,
    statusText: "Unauthorized",
    json: async () => ({ error: { message: "Invalid API key" } }),
  });

  await assert.rejects(
    () =>
      chatCompletion({
        baseURL: "https://example.com/v1",
        apiKey: "bad",
        model: "m",
        messages: [],
        fetchImpl: errorFetch,
      }),
    /401.*Invalid API key/u
  );
});

test("chatCompletion supports Anthropic protocol and keyless Ollama requests", async () => {
  let anthropicReq;
  const anthropicFetch = async (url, init) => {
    anthropicReq = { url, init, body: JSON.parse(init.body) };
    return {
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "fix: resolve timeout" }],
      }),
    };
  };

  const anthropicResult = await chatCompletion({
    baseURL: "https://api.anthropic.com/v1",
    apiKey: "sk-ant-test",
    model: "claude-3-5-haiku-latest",
    messages: buildMessages("diff --git a/a.js b/a.js", "commit"),
    protocol: "anthropic",
    fetchImpl: anthropicFetch,
  });

  assert.equal(anthropicResult, "fix: resolve timeout");
  assert.equal(anthropicReq.url, "https://api.anthropic.com/v1/messages");
  assert.equal(anthropicReq.init.headers["x-api-key"], "sk-ant-test");
  assert.equal(anthropicReq.init.headers["anthropic-version"], "2023-06-01");
  assert.ok(anthropicReq.body.system);
  assert.equal(anthropicReq.body.messages.length, 1);

  let ollamaReq;
  const ollamaFetch = async (url, init) => {
    ollamaReq = { url, init };
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "chore: local commit" } }],
      }),
    };
  };

  const ollamaResult = await chatCompletion({
    baseURL: "http://localhost:11434/v1",
    apiKey: null,
    model: "llama3.2",
    messages: buildMessages("diff", "commit"),
    fetchImpl: ollamaFetch,
  });

  assert.equal(ollamaResult, "chore: local commit");
  assert.equal(ollamaReq.init.headers.Authorization, undefined);
});

test("config falls back to environment variables and handles keyless ollama", () => {
  withTempConfig(() => {
    const prevGroq = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = "gsk_EnvSecret123456";
    try {
      assert.equal(getAIProvider(), "groq");
      assert.equal(getApiKey("groq"), "gsk_EnvSecret123456");
      assert.match(listConfig().GROQ_KEY, /env: GROQ_API_KEY/u);

      setConfig("AI_PROVIDER", "ollama");
      assert.equal(getAIProvider(), "ollama");
      assert.equal(listConfig().OLLAMA_KEY, "(not required)");
    } finally {
      if (prevGroq === undefined) {
        delete process.env.GROQ_API_KEY;
      } else {
        process.env.GROQ_API_KEY = prevGroq;
      }
    }
  });
});

test("parseNameStatus handles renames, deletions, and lockfile filtering", () => {
  const sample = [
    "M\tsrc/index.js",
    "R100\tsrc/old.js\tsrc/new.js",
    "D\tsrc/removed.js",
    "M\tpackage-lock.json",
    "M\tsub/yarn.lock",
  ].join("\n");

  assert.deepEqual(parseNameStatus(sample), [
    { status: "M", file: "src/index.js" },
    { status: "R", oldFile: "src/old.js", file: "src/new.js" },
    { status: "D", file: "src/removed.js" },
  ]);
});

test("git operations work safely in paths with spaces and special characters", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aicommit repo test "));
  try {
    execFileSync("git", ["-C", dir, "init", "-b", "main"]);
    execFileSync("git", [
      "-C",
      dir,
      "config",
      "user.email",
      "test@example.com",
    ]);
    execFileSync("git", ["-C", dir, "config", "user.name", "Test User"]);

    assert.equal(await isGitRepository(dir), true);
    assert.equal(await hasStagedChanges(dir), false);

    fs.writeFileSync(path.join(dir, "hello.js"), "console.log('hi');\n");
    fs.writeFileSync(path.join(dir, "package-lock.json"), "{}\n");
    execFileSync("git", ["-C", dir, "add", "."]);

    assert.equal(await hasStagedChanges(dir), true);
    const diff = await getStagedDiff(dir);
    assert.match(diff, /hello\.js/u);
    assert.doesNotMatch(diff, /package-lock\.json/u);

    // Commit message with single/double quotes and shell metacharacters
    const msg = `feat: handle "quotes" & 'apostrophes' $(noop)`;
    await commitChanges(msg, dir);
    const logMsg = execFileSync(
      "git",
      ["-C", dir, "log", "-1", "--pretty=%s"],
      {
        encoding: "utf8",
      }
    ).trim();
    assert.equal(logMsg, msg);

    await createAndCheckoutBranch("feat/safe-branch", dir);
    const currentBranch = execFileSync(
      "git",
      ["-C", dir, "branch", "--show-current"],
      {
        encoding: "utf8",
      }
    ).trim();
    assert.equal(currentBranch, "feat/safe-branch");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI entry handles version, help, config CRUD, and unknown commands", () => {
  const cliPath = path.resolve("src/index.js");

  withTempConfig((cfgPath) => {
    const env = { ...process.env, AICOMMIT_CONFIG_PATH: cfgPath };

    const versionOut = execFileSync(process.execPath, [cliPath, "-v"], {
      encoding: "utf8",
      env,
    });
    assert.match(versionOut, /^aicommit v\d+\.\d+\.\d+/u);

    const helpOut = execFileSync(process.execPath, [cliPath, "--help"], {
      encoding: "utf8",
      env,
    });
    assert.match(helpOut, /Usage:/u);
    assert.match(helpOut, /Supported providers:/u);

    execFileSync(
      process.execPath,
      [cliPath, "config", "set", "SILICONFLOW_KEY=sk-CliTest1234"],
      { encoding: "utf8", env }
    );

    const getOut = execFileSync(
      process.execPath,
      [cliPath, "config", "get", "SILICONFLOW_KEY"],
      { encoding: "utf8", env }
    );
    assert.match(getOut, /sk-CliTest1234/u);

    const listOut = execFileSync(
      process.execPath,
      [cliPath, "config", "list"],
      {
        encoding: "utf8",
        env,
      }
    );
    assert.match(listOut, /sk-C\.\.\.1234/u);

    execFileSync(
      process.execPath,
      [cliPath, "config", "unset", "SILICONFLOW_KEY"],
      { encoding: "utf8", env }
    );

    assert.throws(
      () =>
        execFileSync(process.execPath, [cliPath, "unknown-command"], {
          encoding: "utf8",
          stdio: "pipe",
          env,
        }),
      (err) => err.status === 1 && /Unknown command/u.test(err.stderr)
    );
  });
});
