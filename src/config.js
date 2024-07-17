const fs = require("fs");
const path = require("path");
const os = require("os");

const CONFIG_FILE = path.join(os.homedir(), ".aicommitrc");

function getConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch (error) {
    return {};
  }
}

function setConfig(key, value) {
  const config = getConfig();
  const normalizedKey = normalizeKey(key);
  config[normalizedKey] = value;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getConfigValue(key) {
  const config = getConfig();
  const normalizedKey = normalizeKey(key);
  return config[normalizedKey];
}

function normalizeKey(key) {
  const keyMap = {
    api_key: "API_KEY",
    ai_provider: "AI_PROVIDER",
    ai_model: "AI_MODEL",
  };
  return keyMap[key.toLowerCase()] || key;
}

function getApiKey() {
  return getConfigValue("API_KEY");
}

function getAIProvider() {
  return getConfigValue("AI_PROVIDER") || "deepseek";
}

function getAIModel() {
  return getConfigValue("AI_MODEL") || "deepseek-chat";
}

function listConfig() {
  const config = getConfig();
  return {
    API_KEY: config.API_KEY
      ? `${config.API_KEY.substr(0, 4)}...${config.API_KEY.substr(-4)}`
      : "未设置",
    AI_PROVIDER: config.AI_PROVIDER || "deepseek (默认)",
    AI_MODEL: config.AI_MODEL || "deepseek-chat (默认)",
  };
}

module.exports = {
  getConfig,
  setConfig,
  getApiKey,
  getAIProvider,
  getAIModel,
  listConfig,
  getConfigValue,
};
