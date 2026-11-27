"use client";

import { Icons } from "@/components/icons";
import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

export function CTA() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <Section id="cta">
      <div className="border overflow-hidden relative text-center py-16 px-6 mx-auto">
        <p className="max-w-3xl text-foreground mb-6 text-balance mx-auto font-medium text-3xl">
          Stop agonizing over commit messages.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-3 rounded-lg border bg-muted/60 px-4 py-2.5 font-mono text-sm text-foreground hover:bg-muted transition-colors"
          >
            <span>{siteConfig.installCommand}</span>
            {copied ? (
              <CheckIcon className="h-4 w-4 text-emerald-500" />
            ) : (
              <CopyIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "default" }),
              "flex items-center gap-2 text-background rounded-lg py-5"
            )}
          >
            <Icons.github className="h-4 w-4" />
            Star on GitHub
          </a>
        </div>
      </div>
    </Section>
  );
}
