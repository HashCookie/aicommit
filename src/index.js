#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  getApiKey,
  setConfig,
  getAIProvider,
  getAIModel,
  listConfig,
  getConfigValue,
} = require("./config");
const {
  isGitRepository,
  checkStagedChanges,
  executeDiff,
} = require("./gitOperations");
const { generateCommitMessage, promptCommit } = require("./messageGenerator");

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
);
const VERSION = packageJson.version;

const args = process.argv.slice(2);

if (args[0] === "--version") {
  console.log(`aicommit version ${VERSION}`);
  process.exit(0);
}

if (args[0] === "config") {
  const command = args[1]?.toLowerCase();
  const key = args[2]?.toLowerCase();

  if (command === "set" && args[2]) {
    const [configKey, configValue] = args[2].split("=");
    if (configValue) {
      setConfig(configKey, configValue);
      console.log(`${configKey} 已成功设置。`);
    } else {
      console.log("无效的set命令。使用格式：aicommit config set 键=值");
    }
  } else if (command === "get" && key) {
    const value = getConfigValue(key);
    if (value) {
      console.log(`${key}: ${value}`);
    } else {
      console.log(`${key} 未设置。`);
    }
  } else if (command === "list") {
    const configs = listConfig();
    console.log("当前配置：");
    Object.entries(configs).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  } else {
    console.log("无效的config命令。可用命令：set, get, list");
  }
  process.exit(0);
}

if (args.length === 0) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error(
      "API密钥未设置。请使用以下命令设置：aicommit config set API_KEY=<你的密钥>"
    );
    process.exit(1);
  }

  isGitRepository()
    .then((isGitRepo) => {
      if (!isGitRepo) {
        console.log("错误：当前目录不是Git仓库。");
        console.log(
          "请在Git仓库中运行'aicommit'，或使用'git init'初始化一个仓库。"
        );
        process.exit(1);
      }
      return checkStagedChanges();
    })
    .then((hasStaged) => {
      if (!hasStaged) {
        console.log(
          "警告：未找到已暂存的更改。请使用'git add'暂存你的更改后再提交。"
        );
        console.log("暂存更改后，再次运行'aicommit'。");
        return;
      }
      return executeDiff();
    })
    .then((diff) => {
      if (diff) {
        return generateCommitMessage(diff);
      }
    })
    .then((commitMessage) => {
      if (commitMessage) {
        promptCommit(commitMessage);
      } else {
        console.log("生成提交消息失败。请重试。");
      }
    })
    .catch((error) => {
      console.error("错误:", error);
    });
}
