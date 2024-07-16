# UniqueAicommit

AI-powered commit message generator.

## Installation

```sh
npm install -g unique-aicommit
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
