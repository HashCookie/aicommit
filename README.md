<h1 align="center">aicommit</h1>

<p align="center">
基于AI自动生成commit信息,通过CLI提升工作流程。
</p>

## 安装

前置:需要安装[Node](https://nodejs.org/)、[NPM](https://www.npmjs.com/)

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

### 生成 Commit 信息

在你的 git 仓库中，运行：

```sh
aicommit
```

演示：
![aicommit](public/aicommit.jpg)

### 生成分支名称

基于暂存区的更改自动生成分支名：

```sh
aicommit branch
# or
aicommit b
```

分支生成功能支持：
- 自动分析暂存区内容生成语义化分支名
- 支持常用分支类型前缀（feat:、fix:、docs: 等）
- 可以编辑或取消生成的分支名
- 自动创建并切换到新分支

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
参考 [aicommits](https://github.com/Nutlope/aicommits)
