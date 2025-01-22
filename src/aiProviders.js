const axios = require("axios");

class AIProvider {
  constructor(apiKey, baseURL) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  getMessages(diff, type = 'commit') {
    const prompts = {
      commit: "You are a commit message generator. Generate a concise commit message following the Conventional Commits specification. Only output the commit message in format 'type: description' without any additional explanation.",
      branch: "You are a branch name generator. Generate a very concise description (max 5 words) that summarizes the changes. Only output the description without any prefix or additional explanation. The output should only contain lowercase letters, numbers and hyphens."
    };
    
    return [
      {
        role: "system",
        content: prompts[type]
      },
      {
        role: "user",
        content: `${diff}`,
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

  async generateBranchName(diff, model) {
    const messages = this.getMessages(diff, 'branch');
    const description = await this.sendRequest(model, messages);
    return this.formatBranchName(description);
  }

  formatBranchName(description) {
    return description
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
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
};
