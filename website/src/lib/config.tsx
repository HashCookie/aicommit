import { Icons } from "@/components/icons";
import {
  CpuIcon,
  GitBranchIcon,
  GlobeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
} from "lucide-react";

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "aicommit",
  description:
    "A lightweight CLI that generates Conventional Commits messages and branch names from staged git diffs using AI.",
  cta: "GitHub",
  installCommand: "npm install -g unique-aicommit",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://hashcookie.github.io/aicommit",
  keywords: [
    "aicommit",
    "unique-aicommit",
    "conventional commits",
    "git cli",
    "ai commit message",
    "ollama",
    "deepseek",
  ],
  links: {
    github: "https://github.com/HashCookie/aicommit",
    npm: "https://www.npmjs.com/package/unique-aicommit",
    releases: "https://github.com/HashCookie/aicommit/releases",
    issues: "https://github.com/HashCookie/aicommit/issues",
  },
  hero: {
    badge: "v1.0.39 · Node >= 20 · Open Source",
    title: "aicommit",
    description:
      "Generate clean Conventional Commits messages and semantic branch names straight from your staged git diff. 12 KB package, zero heavy SDKs, works with 9+ AI providers including local Ollama.",
    cta: "View on GitHub",
    ctaDescription:
      "Works with DeepSeek, OpenAI, Anthropic, Gemini, OpenRouter, Groq, SiliconFlow, Moonshot, and local Ollama.",
  },
  features: [
    {
      name: "9+ Built-in Providers",
      description:
        "Switch effortlessly between DeepSeek, Moonshot, SiliconFlow, OpenAI, OpenRouter, Gemini, Groq, Anthropic, Ollama, or any custom AI_BASE_URL.",
      icon: <CpuIcon className="h-6 w-6" />,
    },
    {
      name: "Interactive CLI & Setup",
      description:
        "Run aicommit setup once to configure provider, key, and language. Accept, edit, or regenerate with automatic deduplication.",
      icon: <TerminalIcon className="h-6 w-6" />,
    },
    {
      name: "Branch Name Generator",
      description:
        "Run aicommit branch to generate a clean slug from your diff, pick a prefix, and auto-checkout in one step.",
      icon: <GitBranchIcon className="h-6 w-6" />,
    },
    {
      name: "Multilingual Commits",
      description:
        "English by default, or set AI_LOCALE=zh for English Conventional Commit types paired with concise Chinese descriptions.",
      icon: <GlobeIcon className="h-6 w-6" />,
    },
    {
      name: "Smart Diff Budgeting",
      description:
        "Prepends git --stat, caps per-file diffs at 4k chars, and ignores lockfiles and generated assets so large files never drown out real code.",
      icon: <SparklesIcon className="h-6 w-6" />,
    },
    {
      name: "Safe & Lightweight",
      description:
        "Uses execFile with argument arrays (zero shell injection), native fetch with timeout, 0600 config permissions, and ships in just 12 KB.",
      icon: <ShieldCheckIcon className="h-6 w-6" />,
    },
  ],
  footer: {
    socialLinks: [
      {
        icon: <Icons.github className="h-5 w-5" />,
        url: "https://github.com/HashCookie/aicommit",
      },
      {
        icon: <Icons.npm className="h-5 w-5" />,
        url: "https://www.npmjs.com/package/unique-aicommit",
      },
    ],
    links: [
      { text: "GitHub", url: "https://github.com/HashCookie/aicommit" },
      { text: "npm", url: "https://www.npmjs.com/package/unique-aicommit" },
      {
        text: "Releases",
        url: "https://github.com/HashCookie/aicommit/releases",
      },
      {
        text: "Issues",
        url: "https://github.com/HashCookie/aicommit/issues",
      },
    ],
    bottomText: "ISC License · Built by HashCookie",
    brandText: "AICOMMIT",
  },
};

export type SiteConfig = typeof siteConfig;
