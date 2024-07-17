const axios = require("axios");
const inquirer = require("inquirer");
const { exec } = require("child_process");
const { getApiKey, getModel } = require("./config");

const baseURL = "https://api.deepseek.com";
const repoPath = process.cwd();

const MAX_DIFF_SIZE = 1000000; // 1MB

function generateCommitMessage(diff) {
  if (diff.length > MAX_DIFF_SIZE) {
    console.warn(
      "Diff is too large. Only the first 1MB will be used for generating the commit message."
    );
    diff = diff.substring(0, MAX_DIFF_SIZE);
  }

  const apiKey = getApiKey();
  const model = getModel();

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
      
      Please provide the commit message directly, without any markdown formatting or code block symbols.
      
      Here is the git diff:
      ${diff}
      
      Commit message:`,
    },
  ];

  return axios
    .post(
      `${baseURL}/chat/completions`,
      {
        model: model,
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

module.exports = { generateCommitMessage, promptCommit };
