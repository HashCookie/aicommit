"use client";

import { Section } from "@/components/section";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const providers = [
  { name: "DeepSeek", model: "deepseek-chat", icon: "deepseek", colored: true },
  { name: "OpenAI", model: "gpt-4o-mini", icon: "openai", colored: false },
  {
    name: "Anthropic",
    model: "claude-3.5-haiku",
    icon: "anthropic",
    colored: false,
  },
  { name: "Gemini", model: "gemini-2.0-flash", icon: "gemini", colored: true },
  {
    name: "OpenRouter",
    model: "multi-model",
    icon: "openrouter",
    colored: false,
  },
  { name: "Groq", model: "llama-3.3-70b", icon: "groq", colored: false },
  {
    name: "SiliconFlow",
    model: "Qwen2.5-7B",
    icon: "siliconflow",
    colored: true,
  },
  {
    name: "Moonshot",
    model: "moonshot-v1-8k",
    icon: "moonshot",
    colored: false,
  },
  { name: "Ollama", model: "local · no key", icon: "ollama", colored: false },
];

export function Logos() {
  return (
    <Section id="providers" title="Supported Providers">
      <div className="border-x border-t">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {providers.map((p, idx) => (
            <div
              key={p.name}
              className={`flex items-center justify-center gap-3 py-6 px-4 hover:bg-muted/40 transition-colors border-b ${
                idx >= 6 ? "sm:border-b-0" : ""
              } ${(idx + 1) % 3 !== 0 ? "sm:border-r" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${basePath}/providers/${p.icon}.svg`}
                alt={p.name}
                width={26}
                height={26}
                className={`h-6 w-6 shrink-0 object-contain ${
                  p.colored ? "" : "dark:invert"
                }`}
              />
              <div className="flex flex-col text-left">
                <span className="font-mono text-sm font-semibold text-foreground leading-tight">
                  {p.name}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground font-mono">
                  {p.model}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
