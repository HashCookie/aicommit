import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_FILE = path.join(os.homedir(), ".aicommitrc");

const DEFAULT_PROVIDER = "deepseek";
const PROVIDER_CONFIGS = {
  deepseek: {
    defaultModel: "deepseek-chat",
    apiKeyName: "DEEPSEEK_KEY",
  },
  moonshot: {
    defaultModel: "moonshot-v1-8k",
    apiKeyName: "MOONSHOT_KEY",
  },
  deepbricks: {
    defaultModel: "gpt-3.5-turbo",
    apiKeyName: "DEEPBRICKS_KEY",
  },
};

function getConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch (error) {
    console.error(`Error reading config file: ${error.message}`);
    return {};
  }
}

function setConfig(key, value) {
  const config = getConfig();
  const normalizedKey = normalizeKey(key);
  config[normalizedKey] = value;

  // 当设置 AI_PROVIDER 时，自动更新 AI_MODEL
  if (normalizedKey === "AI_PROVIDER") {
    const providerConfig = PROVIDER_CONFIGS[value.toLowerCase()];
    if (providerConfig) {
      config["AI_MODEL"] = providerConfig.defaultModel;
    }
  }

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(`Error writing config file: ${error.message}`);
  }
}

function getAIModel() {
  const provider = getAIProvider();
  const config = getConfig();
  return config["AI_MODEL"] || PROVIDER_CONFIGS[provider].defaultModel;
}

function getConfigValue(key) {
  const config = getConfig();
  const normalizedKey = normalizeKey(key);
  return config[normalizedKey];
}

function normalizeKey(key) {
  const keyMap = {
    ai_provider: "AI_PROVIDER",
    ai_model: "AI_MODEL",
  };
  return keyMap[key.toLowerCase()] || key.toUpperCase();
}

function getApiKey() {
  const provider = getAIProvider();
  const providerConfig = PROVIDER_CONFIGS[provider];
  return providerConfig ? getConfigValue(providerConfig.apiKeyName) : null;
}

function getAIProvider() {
  const provider = getConfigValue("AI_PROVIDER");
  return provider && PROVIDER_CONFIGS[provider] ? provider : DEFAULT_PROVIDER;
}

function listConfig() {
  const config = getConfig();
  const provider = getAIProvider();
  const providerConfig = PROVIDER_CONFIGS[provider];

  if (!providerConfig) {
    console.error(`Invalid AI provider: ${provider}`);
    return {};
  }

  const apiKeyName = providerConfig.apiKeyName;

  return {
    [apiKeyName]: config[apiKeyName]
      ? `${config[apiKeyName].substr(0, 4)}...${config[apiKeyName].substr(-4)}`
      : "Not Set",
    AI_PROVIDER: config.AI_PROVIDER || `${DEFAULT_PROVIDER} (Default)`,
    AI_MODEL: getAIModel(),
  };
}

// TODO: Add support for additional AI providers in the future

export {
  getConfig,
  setConfig,
  getApiKey,
  getAIProvider,
  getAIModel,
  listConfig,
  getConfigValue,
  PROVIDER_CONFIGS,
};
