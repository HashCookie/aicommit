<h1 align="center">aicommit</h1>

<p align="center">
基于AI的自动生成commit信息,通过CLI提升工作流程。
</p>

## 安装

```sh
npm install -g unique-aicommit
```

## 用法

### 支持的 AI 模型：

- [DeepSeek](https://www.deepseek.com/)
- [Moonshot](https://platform.moonshot.cn/)
- [Deepbricks](https://deepbricks.ai/)

获取 API 密钥 👆

### 选择 AI 模型

```sh
aicommit config set AI_PROVIDER=deepseek
or
aicommit config set AI_PROVIDER=moonshot
or
aicommit config set AI_PROVIDER=deepbricks
```

设置 API：

```sh
aicommit config set DeepSeek_KEY=<your token>
or
aicommit config set Moonshot_KEY=<your token>
or
aicommit config set Deepbricks_KEY=<your token>
```

在你的 git 仓库中，运行：

```sh
aicommit
```

## 获取配置值

获取完整配置:

```sh
aicommit config list
```

要获取指定配置选项，请使用以下命令：

```sh
aicommit config get <key>
```

例如，要检索 API 密钥：

```sh
aicommit config get DeepSeek_KEY
```
