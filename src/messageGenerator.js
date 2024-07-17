const inquirer = require("inquirer");
const { exec } = require("child_process");
const { getApiKey, getAIProvider, getAIModel } = require("./config");
const { DeepSeekProvider, MoonshotProvider } = require("./aiProviders");

const repoPath = process.cwd();
const MAX_DIFF_SIZE = 1000000; // 1MB

function getAIProviderInstance() {
  const apiKey = getApiKey();
  const provider = getAIProvider();

  switch (provider.toLowerCase()) {
    case "deepseek":
      return new DeepSeekProvider(apiKey);
    case "moonshot":
      return new MoonshotProvider(apiKey);
    default:
      throw new Error(`不支持的AI提供商: ${provider}`);
  }
}

async function generateCommitMessage(diff) {
  if (diff.length > MAX_DIFF_SIZE) {
    console.warn("Diff太大。只有前1MB将用于生成提交消息。");
    diff = diff.substring(0, MAX_DIFF_SIZE);
  }

  const aiProvider = getAIProviderInstance();
  const model = getAIModel();

  try {
    return await aiProvider.generateCommitMessage(diff, model);
  } catch (error) {
    console.error("生成提交消息时出错:", error);
    return null;
  }
}

function promptCommit(commitMessage) {
  commitMessage = commitMessage.replace(/\n/g, "").trim();

  inquirer
    .prompt([
      {
        type: "confirm",
        name: "confirmCommit",
        message: `生成的提交消息:\n${commitMessage}\n\n你想用这个消息提交吗？`,
        default: false,
      },
    ])
    .then((answers) => {
      if (answers.confirmCommit) {
        exec(
          `git -C ${repoPath} commit -m '${commitMessage}'`,
          (error, stdout, stderr) => {
            if (error) {
              console.error(`执行git commit时出错: ${error}`);
              console.error(`Stderr: ${stderr}`);
              if (stderr.includes("nothing to commit")) {
                console.log("没有要提交的更改。使用 'git add' 暂存文件。");
              }
              return;
            }
            console.log(stdout);
          }
        );
      } else {
        console.log("提交已取消。");
      }
    });
}

module.exports = { generateCommitMessage, promptCommit };
