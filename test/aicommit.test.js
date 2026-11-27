import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";

import {
  parseKeyValue,
  setConfig,
  unsetConfig,
  getConfigValue,
  getAIProvider,
  getApiKey,
  getAIModel,
  maskSecret,
  listConfig,
} from "../src/config.js";
import {
  cleanCommitMessage,
  formatBranchName,
  buildMessages,
  chatCompletion,
} from "../src/providers.js";
import {
  isGitRepository,
  hasStagedChanges,
  parseNameStatus,
  getStagedDiff,
  commitChanges,
  createAndCheckoutBranch,
} from "../src/git.js";

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
    const mode = fs.statSync(cfgPath).mode & 0o777;
    assert.equal(mode, 0o600);

    // Setting AI_PROVIDER updates default model
    setConfig("ai_provider", "moonshot");
    assert.equal(getAIProvider(), "moonshot");
    assert.equal(getAIModel(), "moonshot-v1-8k");

    // Invalid provider throws
    assert.throws(() => setConfig("AI_PROVIDER", "unknown"), /Unsupported AI_PROVIDER/);

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
    cleanCommitMessage("```\n\"feat: add retry logic\"\n```"),
    "feat: add retry logic"
  );
  assert.equal(
    cleanCommitMessage("fix: handle empty diff\n\nExtra explanation"),
    "fix: handle empty diff"
  );
  assert.equal(
    formatBranchName("```\nAdd User Login & OAuth2!\n```"),
    "add-user-login-oauth2"
  );
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
    /401.*Invalid API key/
  );
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
    execFileSync("git", ["-C", dir, "config", "user.email", "test@example.com"]);
    execFileSync("git", ["-C", dir, "config", "user.name", "Test User"]);

    assert.equal(await isGitRepository(dir), true);
    assert.equal(await hasStagedChanges(dir), false);

    fs.writeFileSync(path.join(dir, "hello.js"), "console.log('hi');\n");
    fs.writeFileSync(path.join(dir, "package-lock.json"), "{}\n");
    execFileSync("git", ["-C", dir, "add", "."]);

    assert.equal(await hasStagedChanges(dir), true);
    const diff = await getStagedDiff(dir);
    assert.match(diff, /hello\.js/);
    assert.doesNotMatch(diff, /package-lock\.json/);

    // Commit message with single/double quotes and shell metacharacters
    const msg = `feat: handle "quotes" & 'apostrophes' $(noop)`;
    await commitChanges(msg, dir);
    const logMsg = execFileSync("git", ["-C", dir, "log", "-1", "--pretty=%s"], {
      encoding: "utf8",
    }).trim();
    assert.equal(logMsg, msg);

    await createAndCheckoutBranch("feat/safe-branch", dir);
    const currentBranch = execFileSync("git", ["-C", dir, "branch", "--show-current"], {
      encoding: "utf8",
    }).trim();
    assert.equal(currentBranch, "feat/safe-branch");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
