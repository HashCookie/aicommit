const axios = require("axios");

class AIProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async generateCommitMessage(diff, model) {
    throw new Error("方法未实现");
  }
}

class DeepSeekProvider extends AIProvider {
  constructor(apiKey) {
    super(apiKey);
    this.baseURL = "https://api.deepseek.com/v1";
  }

  async generateCommitMessage(diff, model) {
    const messages = [
      {
        role: "system",
        content:
          "You are an AI assistant, please analyze the git diff below and generate a standardized commit message.",
      },
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

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: model,
          messages: messages,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error("使用DeepSeek生成提交消息时出错:", error);
      throw error;
    }
  }
}

class MoonshotProvider extends AIProvider {
  constructor(apiKey) {
    super(apiKey);
    this.baseURL = "https://api.moonshot.cn/v1";
  }

  async generateCommitMessage(diff, model) {
    const messages = [
      {
        role: "system",
        content:
          "You are an AI assistant, please analyze the git diff below and generate a standardized commit message.",
      },
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

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: model,
          messages: messages,
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error("使用Moonshot生成提交消息时出错:", error);
      throw error;
    }
  }
}

module.exports = {
  DeepSeekProvider,
  MoonshotProvider,
};
