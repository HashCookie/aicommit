import fs from "fs";
import os from "os";
import path from "path";
import { DEFAULT_PROVIDER, PROVIDERS } from "./providers.js";

function getConfigFilePath() {
  return (
    process.env.AICOMMIT_CONFIG_PATH || path.join(os.homedir(), ".aicommitrc")
  );
}

function normalizeKey(key) {
  return key.trim().toUpperCase();
}

function parseKeyValue(input) {
  if (!input || typeof input !== "string") {
    return null;
  }
  const eqIndex = input.indexOf("=");
  if (eqIndex <= 0) {
    return null;
  }
  const key = input.slice(0, eqIndex).trim();
  const value = input.slice(eqIndex + 1).trim();
  if (!(key && value)) {
    return null;
  }
  return { key, value };
}

function readConfig() {
  const filePath = getConfigFilePath();
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw new Error(
      `Failed to read config file (${filePath}): ${error.message}`,
      { cause: error }
    );
  }
}

function writeConfig(config) {
  const filePath = getConfigFilePath();
  fs.writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
}

function setConfig(key, value) {
  const config = readConfig();
  const normalizedKey = normalizeKey(key);

  if (normalizedKey === "AI_PROVIDER") {
    const providerName = value.toLowerCase();
    const providerConfig = PROVIDERS[providerName];
    if (!providerConfig) {
      const supported = Object.keys(PROVIDERS).join(", ");
      throw new Error(
        `Unsupported AI_PROVIDER "${value}". Supported providers: ${supported}`
      );
    }
    config.AI_PROVIDER = providerName;
    config.AI_MODEL = providerConfig.defaultModel;
  } else {
    config[normalizedKey] = value;
  }

  writeConfig(config);
  return { key: normalizedKey, value: config[normalizedKey] };
}

function unsetConfig(key) {
  const config = readConfig();
  const normalizedKey = normalizeKey(key);
  if (!(normalizedKey in config)) {
    return false;
  }
  delete config[normalizedKey];
  writeConfig(config);
  return true;
}

function getConfigValue(key) {
  const config = readConfig();
  return config[normalizeKey(key)];
}

function findEnvKey(meta) {
  for (const envName of meta.envKeys || []) {
    if (process.env[envName]) {
      return { value: process.env[envName], envName };
    }
  }
  return null;
}

function getAIProvider() {
  const config = readConfig();
  const configured = config.AI_PROVIDER?.toLowerCase();
  if (configured && PROVIDERS[configured]) {
    return configured;
  }

  // If AI_PROVIDER is unset and the default provider has no key,
  // auto-detect the first provider with a configured key (config file first, then env).
  const defaultMeta = PROVIDERS[DEFAULT_PROVIDER];
  if (!(config[defaultMeta.apiKeyName] || findEnvKey(defaultMeta))) {
    const fromConfig = Object.entries(PROVIDERS).find(([, meta]) =>
      Boolean(config[meta.apiKeyName])
    );
    if (fromConfig) {
      return fromConfig[0];
    }

    const fromEnv = Object.entries(PROVIDERS).find(([, meta]) =>
      Boolean(findEnvKey(meta))
    );
    if (fromEnv) {
      return fromEnv[0];
    }
  }

  return DEFAULT_PROVIDER;
}

function getProviderMeta(provider = getAIProvider()) {
  return PROVIDERS[provider] || PROVIDERS[DEFAULT_PROVIDER];
}

function getApiKey(provider = getAIProvider()) {
  const meta = getProviderMeta(provider);
  const fromConfig = getConfigValue(meta.apiKeyName);
  if (fromConfig) {
    return fromConfig;
  }
  const fromEnv = findEnvKey(meta);
  return fromEnv ? fromEnv.value : null;
}

function getAIModel(provider = getAIProvider()) {
  const config = readConfig();
  return config.AI_MODEL || getProviderMeta(provider).defaultModel;
}

function getBaseURL(provider = getAIProvider()) {
  const config = readConfig();
  return config.AI_BASE_URL || getProviderMeta(provider).baseURL;
}

function getLocale() {
  return getConfigValue("AI_LOCALE") || "en";
}

function maskSecret(value) {
  if (!value || typeof value !== "string") {
    return "Not Set";
  }
  if (value.length <= 8) {
    return "****";
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function listConfig() {
  const config = readConfig();
  const provider = getAIProvider();
  const meta = getProviderMeta(provider);
  const { apiKeyName } = meta;

  let keyDisplay;
  if (
    meta.requiresApiKey === false &&
    !config[apiKeyName] &&
    !findEnvKey(meta)
  ) {
    keyDisplay = "(not required)";
  } else if (config[apiKeyName]) {
    keyDisplay = maskSecret(config[apiKeyName]);
  } else {
    const envHit = findEnvKey(meta);
    keyDisplay = envHit
      ? `${maskSecret(envHit.value)} (env: ${envHit.envName})`
      : "Not Set";
  }

  const result = {
    AI_PROVIDER: config.AI_PROVIDER || `${provider} (auto)`,
    AI_MODEL: getAIModel(provider),
    AI_BASE_URL: getBaseURL(provider),
    [apiKeyName]: keyDisplay,
  };

  if (config.AI_LOCALE) {
    result.AI_LOCALE = config.AI_LOCALE;
  }

  if (config.MAX_DIFF_CHARS) {
    result.MAX_DIFF_CHARS = config.MAX_DIFF_CHARS;
  }

  return result;
}

export { PROVIDERS } from "./providers.js";
export {
  getAIModel,
  getAIProvider,
  getApiKey,
  getBaseURL,
  getConfigValue,
  getLocale,
  getProviderMeta,
  listConfig,
  maskSecret,
  normalizeKey,
  parseKeyValue,
  readConfig,
  setConfig,
  unsetConfig,
};
