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

Retrieve your API key from [DeepSeek](https://www.deepseek.com/)

Set the key:

```sh
aicommit config set DeepSeek_KEY=<your token>
```

In your git repository, run:

```sh
aicommit
```

## Reading a configuration value

To get the configuration options, use this command:

```sh
aicommit config get <key>
```

For example, to retrieve the API key, you can use:

```sh
aicommit config get DeepSeek_KEY
```
