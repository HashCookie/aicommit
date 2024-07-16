#!/usr/bin/env node

const { exec } = require("child_process");
const axios = require("axios");
const inquirer = require("inquirer");
const { getApiKey, setConfig } = require("./config");

const baseURL = "https://api.deepseek.com";

// 获取当前工作目录
const repoPath = process.cwd();

// 命令行参数解析
const args = process.argv.slice(2);

if (
  args[0] === "config" &&
  args[1] === "set" &&
  args[2].startsWith("DeepSeek_KEY=")
) {
  const apiKey = args[2].split("=")[1];
  setConfig("DeepSeek_KEY", apiKey);
  console.log("API key has been set successfully.");
  process.exit(0);
}

// 检查API密钥是否已设置
const apiKey = getApiKey();
if (!apiKey) {
  console.error(
    "API key is not set. Please set it using: aicommit config set DeepSeek_KEY=<your token>"
  );
  process.exit(1);
}

function isGitRepository() {
  return new Promise((resolve) => {
    exec("git rev-parse --is-inside-work-tree", (error) => {
      resolve(!error);
    });
  });
}

function generateCommitMessage(diff) {
  // 准备API请求数据
  const messages = [
    { role: "system", content: "You are a helpful assistant" },
    {
      role: "user",
      content: `Analyze the following git diff and generate a standardized commit message following the Conventional Commits specification.
      The commit message should start with one of the following types:
      - feat: A new feature
      - fix: A bug fix
      - docs: Documentation only changes
      - style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
      - refactor: A code change that neither fixes a bug nor adds a feature
      - perf: A code change that improves performance
      - test: Adding missing tests or correcting existing tests
      - chore: Changes to the build process or auxiliary tools and libraries such as documentation generation
      
      Example commit messages:
      - feat: add new user authentication method
      - fix: correct typo in README
      - docs: update API documentation
      
      Here is the git diff:
      ${diff}
      
      Commit message:`,
    },
  ];

  // 调用DeepSeek API分析差异并生成commit信息
  return axios
    .post(
      `${baseURL}/chat/completions`,
      {
        model: "deepseek-chat",
        messages: messages,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    )
    .then((response) => {
      let commitMessage = response.data.choices[0].message.content.trim();
      commitMessage = commitMessage.replace("Commit message:", "").trim();
      return commitMessage;
    })
    .catch((error) => {
      console.error("Error generating commit message:", error);
      return null;
    });
}

function promptCommit(commitMessage) {
  // 移除可能存在的代码块标记
  commitMessage = commitMessage.replace(/```/g, "").trim();

  inquirer
    .prompt([
      {
        type: "confirm",
        name: "confirmCommit",
        message: `Generated commit message:\n${commitMessage}\n\nDo you want to commit with this message?`,
        default: false,
      },
    ])
    .then((answers) => {
      if (answers.confirmCommit) {
        // 执行提交操作，使用单引号包裹提交消息以避免 shell 解释特殊字符
        exec(
          `git -C ${repoPath} commit -m '${commitMessage}'`,
          (error, stdout, stderr) => {
            if (error) {
              console.error(`Error executing git commit: ${error}`);
              console.error(`Stderr: ${stderr}`);
              if (stderr.includes("nothing to commit")) {
                console.log(
                  "No changes added to commit. Use 'git add' to stage files."
                );
              }
              return;
            }
            console.log(stdout);
          }
        );
      } else {
        console.log("Commit aborted.");
      }
    });
}

function checkStagedChanges() {
  return new Promise((resolve, reject) => {
    exec(`git -C ${repoPath} diff --staged --quiet`, (error) => {
      if (error && error.code === 1) {
        // 有暂存的更改
        resolve(true);
      } else if (!error) {
        // 没有暂存的更改
        resolve(false);
      } else {
        // 其他错误
        reject(error);
      }
    });
  });
}

// 主流程
isGitRepository()
  .then((isGitRepo) => {
    if (!isGitRepo) {
      console.log("Error: The current directory is not a Git repository.");
      console.log(
        "Please run 'aicommit' in a Git repository or initialize one with 'git init'."
      );
      process.exit(1);
    }

    return checkStagedChanges();
  })
  .then((hasStaged) => {
    if (!hasStaged) {
      console.log(
        "Warning: No staged changes found. Please use 'git add' to stage your changes before committing."
      );
      console.log("After staging your changes, run 'aicommit' again.");
      return;
    }

    // 获取暂存的差异
    exec(`git -C ${repoPath} diff --staged`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing git diff: ${error}`);
        return;
      }
      const diff = stdout;

      // 生成提交消息并提示用户选择
      generateCommitMessage(diff).then((commitMessage) => {
        if (commitMessage) {
          promptCommit(commitMessage);
        } else {
          console.log("Failed to generate commit message. Please try again.");
        }
      });
    });
  })
  .catch((error) => {
    console.error("Error:", error);
  });
