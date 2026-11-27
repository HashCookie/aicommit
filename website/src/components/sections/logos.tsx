"use client";

import { Section } from "@/components/section";

const providers = [
  { name: "DeepSeek", model: "deepseek-chat" },
  { name: "OpenAI", model: "gpt-4o-mini" },
  { name: "Anthropic", model: "claude-3.5-haiku" },
  { name: "Gemini", model: "gemini-2.0-flash" },
  { name: "OpenRouter", model: "multi-model" },
  { name: "Groq", model: "llama-3.3-70b" },
  { name: "SiliconFlow", model: "Qwen2.5-7B" },
  { name: "Moonshot", model: "moonshot-v1-8k" },
  { name: "Ollama", model: "local · no key" },
];

export function Logos() {
  return (
    <Section id="providers" title="Supported Providers">
      <div className="border-x border-t">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {providers.map((p, idx) => (
            <div
              key={p.name}
              className={`flex flex-col items-center justify-center py-6 px-4 text-center hover:bg-muted/40 transition-colors border-b ${
                idx >= 6 ? "sm:border-b-0" : ""
              } ${(idx + 1) % 3 !== 0 ? "sm:border-r" : ""}`}
            >
              <span className="font-mono text-sm font-semibold text-foreground">
                {p.name}
              </span>
              <span className="mt-1 text-xs text-muted-foreground font-mono">
                {p.model}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
