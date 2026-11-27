"use client";

import { Section } from "@/components/section";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const set1 = [
  { name: "DeepSeek", icon: "deepseek" },
  { name: "OpenAI", icon: "openai" },
  { name: "Anthropic", icon: "anthropic" },
  { name: "Gemini", icon: "gemini" },
  { name: "OpenRouter", icon: "openrouter" },
  { name: "Groq", icon: "groq" },
];

const set2 = [
  { name: "SiliconFlow", icon: "siliconflow" },
  { name: "Moonshot", icon: "moonshot" },
  { name: "Ollama", icon: "ollama" },
  { name: "DeepSeek", icon: "deepseek" },
  { name: "OpenAI", icon: "openai" },
  { name: "Anthropic", icon: "anthropic" },
];

export function Logos() {
  const [currentSet, setCurrentSet] = useState(set1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSet((prev) => (prev === set1 ? set2 : set1));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Section id="providers">
      <div className="border-x border-t">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          {set1.map((_, idx) => {
            const item = currentSet[idx];
            return (
              <div
                key={idx}
                className="flex group items-center justify-center p-4 h-16 border-r border-t last:border-r-0 sm:last:border-r md:[&:nth-child(3n)]:border-r md:[&:nth-child(6n)]:border-r-0 [&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+3)]:border-t-0 sm:[&:nth-child(3n)]:border-r-0 md:[&:nth-child(-n+6)]:border-t-0 [&:nth-child(2n)]:border-r-0 sm:[&:nth-child(2n)]:border-r"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${item.name}-${idx}`}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{
                      duration: 0.4,
                      ease: "easeInOut",
                      delay: idx * 0.04,
                    }}
                    className="flex items-center gap-2 opacity-45 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${basePath}/providers/${item.icon}.svg`}
                      alt={item.name}
                      width={20}
                      height={20}
                      className="h-5 w-5 shrink-0 object-contain grayscale brightness-0 dark:invert"
                    />
                    <span className="font-mono text-xs sm:text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
