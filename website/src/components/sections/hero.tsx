"use client";

import { Icons } from "@/components/icons";
import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckIcon, CopyIcon, TerminalIcon } from "lucide-react";
import { useState } from "react";

const ease = [0.16, 1, 0.3, 1];

function HeroPill() {
  return (
    <motion.a
      href={siteConfig.links.releases}
      target="_blank"
      rel="noreferrer"
      className="flex w-auto items-center space-x-2 rounded-full bg-primary/15 px-3 py-1 ring-1 ring-border whitespace-pre"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease }}
    >
      <div className="w-fit rounded-full bg-accent px-2 py-0.5 text-left text-xs font-medium text-primary">
        CLI
      </div>
      <p className="text-xs font-medium text-foreground sm:text-sm">
        {siteConfig.hero.badge}
      </p>
    </motion.a>
  );
}

function HeroTitles() {
  return (
    <div className="flex w-full max-w-3xl flex-col overflow-hidden pt-6">
      <motion.h1
        className="text-left text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl tracking-tight font-mono"
        initial={{ filter: "blur(8px)", opacity: 0, y: 24 }}
        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
      >
        {siteConfig.hero.title}
      </motion.h1>
      <motion.p
        className="mt-3 text-left max-w-xl leading-relaxed text-muted-foreground sm:text-lg text-balance"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.7, ease }}
      >
        {siteConfig.hero.description}
      </motion.p>
    </div>
  );
}

function HeroCTA() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="relative mt-6 w-full min-w-0">
      <motion.div
        className="flex w-full flex-wrap items-center gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7, ease }}
      >
        <button
          type="button"
          onClick={handleCopy}
          className="flex max-w-full items-center gap-3 rounded-lg border bg-muted/60 px-3.5 h-10 font-mono text-xs sm:text-[13px] text-foreground hover:bg-muted transition-colors"
        >
          <span className="flex items-center gap-2 min-w-0">
            <TerminalIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{siteConfig.installCommand}</span>
          </span>
          {copied ? (
            <CheckIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-1" />
          ) : (
            <CopyIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
          )}
        </button>

        <a
          href={siteConfig.links.github}
          target="_blank"
          rel="noreferrer"
          className={cn(
            buttonVariants({ variant: "default" }),
            "bg-foreground text-background hover:bg-foreground/90 flex gap-2 rounded-lg h-10 px-4 shrink-0"
          )}
        >
          <Icons.github className="h-4 w-4" />
          {siteConfig.hero.cta}
        </a>
      </motion.div>
      <motion.p
        className="mt-3 text-sm text-muted-foreground text-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.7 }}
      >
        {siteConfig.hero.ctaDescription}
      </motion.p>
    </div>
  );
}

function TerminalPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.8, ease }}
      className="w-full rounded-xl border bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden font-mono text-xs sm:text-sm"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 bg-zinc-900/70">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        </div>
        <span className="text-[11px] text-zinc-400">zsh — aicommit</span>
        <span className="w-10" />
      </div>

      <div className="p-5 space-y-3 leading-relaxed">
        <div>
          <span className="text-emerald-400">❯</span>{" "}
          <span className="text-zinc-200">
            aicommit -a -c &quot;fix Safari date parsing&quot;
          </span>
        </div>

        <div className="text-zinc-400">
          ? Generated commit message:
          <div className="mt-1 pl-2 text-sky-300 font-semibold">
            fix: replace hyphens with slashes in date parsing for Safari
            compatibility
          </div>
        </div>

        <div className="pt-1 space-y-0.5 text-zinc-400">
          <div>What would you like to do?</div>
          <div className="text-emerald-400">❯ Accept</div>
          <div className="pl-3">Edit</div>
          <div className="pl-3">Regenerate</div>
          <div className="pl-3">Cancel</div>
        </div>

        <div className="pt-2 border-t border-zinc-800/80 text-zinc-300">
          <span className="text-emerald-400">[main 5e8d9f5]</span> fix: replace
          hyphens with slashes in date parsing for Safari compatibility
          <div className="text-zinc-500">
            1 file changed, 2 insertions(+), 1 deletion(-)
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <Section id="hero">
      <div className="relative grid grid-cols-1 lg:grid-cols-[1.08fr_1fr] gap-10 items-center w-full p-6 lg:p-12 border-x overflow-hidden">
        <div className="flex flex-col justify-start items-start min-w-0">
          <HeroPill />
          <HeroTitles />
          <HeroCTA />
        </div>
        <div className="w-full min-w-0">
          <TerminalPreview />
        </div>
      </div>
    </Section>
  );
}
