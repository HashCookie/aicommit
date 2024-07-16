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
  config[key] = value;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getApiKey() {
  const config = getConfig();
  return config.DeepSeek_KEY;
}

module.exports = { getConfig, setConfig, getApiKey };
