<h1 align="center">UniqueAicommit</h1>

[中文](README_ZH.md)

<p align="center">
AI-powered commit message generator for enhancing workflow via CLI.
</p>

## Installation

### Using npm

```sh
npm install -g unique-aicommit
```

### Using yarn

```sh
yarn global add unique-aicommit
```

### Using pnpm

```sh
pnpm add -g unique-aicommit
```

## Usage

### Supported Models:

- [DeepSeek](https://www.deepseek.com/)
- [Moonshot](https://platform.moonshot.cn/)
- [Deepbricks](https://deepbricks.ai/)

Get api key from 👆

### Select AI model

```sh
aicommit config set AI_PROVIDER=deepseek
or
aicommit config set AI_PROVIDER=moonshot
or
aicommit config set AI_PROVIDER=deepbricks
```

Set the key:

```sh
aicommit config set DeepSeek_KEY=<your token>
or
aicommit config set Moonshot_KEY=<your token>
or
aicommit config set Deepbricks_KEY=<your token>
```

In your git repository, run:

```sh
aicommit
```

## Reading a configuration value

Get Full Configuration

```sh
aicommit config list
```

To get the configuration options, use this command:

```sh
aicommit config get <key>
```

For example, to retrieve the API key, you can use:

```sh
aicommit config get DeepSeek_KEY
```
