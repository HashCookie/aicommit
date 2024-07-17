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
          "你是一个AI助手，请分析以下git diff并生成一个标准化的提交消息。",
      },
      { role: "user", content: `分析以下git diff并生成提交消息:\n\n${diff}` },
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
          "你是 Kimi，由 Moonshot AI 提供的人工智能助手。请分析以下git diff并生成一个标准化的提交消息。",
      },
      { role: "user", content: `分析以下git diff并生成提交消息:\n\n${diff}` },
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
