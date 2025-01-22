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
          "You are a commit message generator. Generate a concise commit message following the Conventional Commits specification. Only output the commit message in format 'type: description' without any additional explanation.",
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
