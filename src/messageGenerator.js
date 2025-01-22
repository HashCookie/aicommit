const inquirer = require("inquirer");
const { exec } = require("child_process");
const { getApiKey, getAIProvider, getAIModel } = require("./config");
const {
  DeepSeekProvider,
  MoonshotProvider,
  DeepbricksProvider,
} = require("./aiProviders");
const { createAndCheckoutBranch } = require("./gitOperations");

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
    case "deepbricks":
      return new DeepbricksProvider(apiKey);
    default:
      throw new Error(`Unsupported AI providers: ${provider}`);
  }
}

async function generateCommitMessage(diff) {
  if (diff.length > MAX_DIFF_SIZE) {
    console.warn(
      "Diff is too large. Only the first 1MB will be used to generate the commit message."
    );
    diff = diff.substring(0, MAX_DIFF_SIZE);
  }

  const aiProvider = getAIProviderInstance();
  const model = getAIModel();

  try {
    return await aiProvider.generateCommitMessage(diff, model);
  } catch (error) {
    console.error("Error generating commit message.", error);
    return null;
  }
}

function promptCommit(commitMessage) {
  commitMessage = commitMessage.replace(/\n/g, "").trim();

  inquirer
    .prompt([
      {
        type: "list",
        name: "action",
        message: `Generated commit message:\n${commitMessage}\n\nWhat would you like to do?`,
        choices: ["Accept", "Edit", "Cancel"],
      },
    ])
    .then((answer) => {
      switch (answer.action) {
        case "Accept":
          executeCommit(commitMessage);
          break;
        case "Edit":
          inquirer
            .prompt([
              {
                type: "input",
                name: "editedMessage",
                message: "Edit the commit message:",
                default: commitMessage,
              },
            ])
            .then((editAnswer) => {
              executeCommit(editAnswer.editedMessage);
            });
          break;
        case "Cancel":
          console.log("Commit cancelled.");
          break;
      }
    });
}

function executeCommit(message) {
  const cleanedMessage = message.replace(/^["']|["']$/g, '').replace(/'/g, "'\\''");
  exec(`git -C ${repoPath} commit -m '${cleanedMessage}'`, (error, stdout, stderr) => {
    if (error) {
      console.error(`git commit error: ${error}`);
      console.error(`Stderr: ${stderr}`);
      if (stderr.includes("nothing to commit")) {
        console.log(
          "There are no changes to commit. Use 'git add' to stage your changes."
        );
      }
      return;
    }
    console.log(stdout);
  });
}

async function generateBranchName(diff) {
  if (diff.length > MAX_DIFF_SIZE) {
    console.warn("Diff is too large. Only the first 1MB will be used to generate the branch name.");
    diff = diff.substring(0, MAX_DIFF_SIZE);
  }

  const aiProvider = getAIProviderInstance();
  const model = getAIModel();

  try {
    return await aiProvider.generateBranchName(diff, model);
  } catch (error) {
    console.error("Error generating branch name.", error);
    return null;
  }
}

function promptBranchCreation(branchName) {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'prefix',
        message: '选择分支类型:',
        choices: ['feat:', 'fix:', 'docs:', 'chore:', 'refactor:', '不需要前缀'],
      },
      {
        type: 'list',
        name: 'action',
        message: `生成的分支名:\n${branchName}\n\n您想要?`,
        choices: ['接受', '编辑', '取消'],
      },
    ])
    .then(async (answers) => {
      const prefix = answers.prefix === '不需要前缀' ? '' : `${answers.prefix} `;
      const fullBranchName = `${prefix}${branchName}`;

      switch (answers.action) {
        case '接受':
          try {
            await createAndCheckoutBranch(fullBranchName);
            console.log(`已成功创建并切换到分支: ${fullBranchName}`);
          } catch (error) {
            console.error('创建分支失败:', error.message);
          }
          break;
        case '编辑':
          inquirer
            .prompt([
              {
                type: 'input',
                name: 'editedName',
                message: '编辑分支名:',
                default: fullBranchName,
              },
            ])
            .then(async (editAnswer) => {
              try {
                await createAndCheckoutBranch(editAnswer.editedName);
                console.log(`已成功创建并切换到分支: ${editAnswer.editedName}`);
              } catch (error) {
                console.error('创建分支失败:', error.message);
              }
            });
          break;
        case '取消':
          console.log('已取消创建分支。');
          break;
      }
    });
}

module.exports = { 
  generateCommitMessage, 
  promptCommit,
  generateBranchName,
  promptBranchCreation 
};
