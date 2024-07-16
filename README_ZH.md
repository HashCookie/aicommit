<h1 align="center">UniqueAicommit</h1>

<p align="center">
AI 驱动的提交消息生成器，通过命令行界面（CLI）增强工作流程。
</p>

## 安装

### 使用 npm

```sh
npm install -g unique-aicommit
```

### 使用 yarn

```sh
yarn global add unique-aicommit
```

### 使用 pnpm

```sh
pnpm add -g unique-aicommit
```

## 用法

从 [DeepSeek](https://www.deepseek.com/) 获取 API 密钥

Retrieve your API key from

设置 API：

```sh
aicommit config set DeepSeek_KEY=<your token>
```

在 git 仓库中运行：

```sh
aicommit
```

## 读取配置值

要获取配置选项，使用以下命令：

```sh
aicommit config get <key>
```

例如，要获取 API 密钥，可以使用：

```sh
aicommit config get DeepSeek_KEY
```
