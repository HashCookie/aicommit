const axios = require("axios");

class AIProvider {
  constructor(apiKey, baseURL) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  getMessages(diff) {
    return [
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
  }

  async sendRequest(model, messages, additionalParams = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: model,
          messages: messages,
          ...additionalParams,
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
      console.error(
        `Use${this.constructor.name}Error generating commit message:`,
        error
      );
      throw error;
    }
  }

  async generateCommitMessage(diff, model) {
    throw new Error("Method not implemented");
  }
}

class DeepSeekProvider extends AIProvider {
  constructor(apiKey) {
    super(apiKey, "https://api.deepseek.com/v1");
  }

  async generateCommitMessage(diff, model) {
    const messages = this.getMessages(diff);
    return await this.sendRequest(model, messages);
  }
}

class MoonshotProvider extends AIProvider {
  constructor(apiKey) {
    super(apiKey, "https://api.moonshot.cn/v1");
  }

  async generateCommitMessage(diff, model) {
    const messages = this.getMessages(diff);
    return await this.sendRequest(model, messages, { temperature: 0.3 });
  }
}

class DeepbricksProvider extends AIProvider {
  constructor(apiKey) {
    super(apiKey, "https://api.deepbricks.ai/v1");
  }

  async generateCommitMessage(diff, model) {
    const messages = this.getMessages(diff);
    return await this.sendRequest(model, messages);
  }
}

module.exports = {
  DeepSeekProvider,
  MoonshotProvider,
  DeepbricksProvider,
  DeepbricksProvider,
};
