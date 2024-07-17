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
    deepseek_key: "DeepSeek_KEY",
    model: "MODEL",
  };
  return keyMap[key.toLowerCase()] || key;
}

function getApiKey() {
  return getConfigValue("DeepSeek_KEY");
}

function getModel() {
  return getConfigValue("MODEL") || "deepseek-chat"; // 默认使用 "deepseek-chat"
}

function listConfig() {
  const config = getConfig();
  return {
    DeepSeek_KEY: config.DeepSeek_KEY
      ? `${config.DeepSeek_KEY.substr(0, 4)}...${config.DeepSeek_KEY.substr(
          -4
        )}`
      : "Not set",
    MODEL: config.MODEL || "deepseek-chat (default)",
  };
}

module.exports = {
  getConfig,
  setConfig,
  getApiKey,
  getModel,
  listConfig,
  getConfigValue,
};
