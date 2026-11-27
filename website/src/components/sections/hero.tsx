"use client";

import { AuroraText } from "@/components/aurora-text";
import { Icons } from "@/components/icons";
import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

const ease = [0.16, 1, 0.3, 1];

function HeroPill() {
  return (
    <motion.a
      href={siteConfig.links.releases}
      target="_blank"
      rel="noreferrer"
      className="flex w-auto items-center space-x-2 rounded-full bg-primary/20 px-2 py-1 ring-1 ring-accent whitespace-pre"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease }}
    >
      <div className="w-fit rounded-full bg-accent px-2 py-0.5 text-left text-xs font-medium text-primary sm:text-sm">
        v1.0.39
      </div>
      <p className="text-xs font-medium text-primary sm:text-sm">
        Introducing aicommit
      </p>
      <svg
        width="12"
        height="12"
        className="ml-1 text-primary"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.78141 5.33312L5.20541 1.75712L6.14808 0.814453L11.3334 5.99979L6.14808 11.1851L5.20541 10.2425L8.78141 6.66645H0.666748V5.33312H8.78141Z"
          fill="currentColor"
        />
      </svg>
    </motion.a>
  );
}

function HeroTitles() {
  return (
    <div className="flex w-full max-w-3xl flex-col overflow-hidden pt-6">
      <motion.h1
        className="text-left text-4xl font-semibold leading-tighter text-foreground sm:text-5xl md:text-6xl tracking-tighter"
        initial={{ filter: "blur(10px)", opacity: 0, y: 30 }}
        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease }}
      >
        <AuroraText className="leading-normal font-bold">
          {siteConfig.hero.title}
        </AuroraText>
      </motion.h1>
      <motion.p
        className="mt-2 text-left max-w-xl leading-normal text-muted-foreground sm:text-lg sm:leading-normal text-balance"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.8, ease }}
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
    <div className="relative mt-6 w-full">
      <motion.div
        className="flex w-full flex-wrap items-center gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8, ease }}
      >
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            buttonVariants({ variant: "default" }),
            "text-primary-foreground flex items-center gap-2 rounded-lg font-mono text-xs sm:text-sm h-10 px-4"
          )}
        >
          <Icons.logo className="h-4 w-4 shrink-0" />
          <span>{siteConfig.installCommand}</span>
          {copied ? (
            <CheckIcon className="h-3.5 w-3.5 shrink-0 ml-1" />
          ) : (
            <CopyIcon className="h-3.5 w-3.5 shrink-0 ml-1 opacity-75" />
          )}
        </button>

        <a
          href="#examples"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-lg h-10 px-4 font-medium"
          )}
        >
          Examples
        </a>
      </motion.div>
      <motion.p
        className="mt-3 text-sm text-muted-foreground text-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.8 }}
      >
        {siteConfig.hero.ctaDescription}
      </motion.p>
    </div>
  );
}

function TerminalPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8, ease }}
      className="w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden font-mono text-xs sm:text-[13px]"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted/40">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        </div>
        <span className="text-[11px] text-muted-foreground">zsh — aicommit</span>
        <span className="w-8" />
      </div>

      <div className="p-5 space-y-3 leading-relaxed text-card-foreground">
        <div>
          <span className="text-primary">❯</span>{" "}
          <span>aicommit -a -c &quot;fix Safari date parsing&quot;</span>
        </div>

        <div className="text-muted-foreground">
          ? Generated commit message:
          <div className="mt-1 pl-2 text-primary font-medium">
            fix: replace hyphens with slashes in date parsing for Safari
            compatibility
          </div>
        </div>

        <div className="pt-1 space-y-0.5 text-muted-foreground">
          <div>What would you like to do?</div>
          <div className="text-primary font-medium">❯ Accept</div>
          <div className="pl-3">Edit</div>
          <div className="pl-3">Regenerate</div>
          <div className="pl-3">Cancel</div>
        </div>

        <div className="pt-2 border-t border-border text-muted-foreground">
          <span className="text-primary">[main 5e8d9f5]</span> fix: replace
          hyphens with slashes in date parsing for Safari compatibility
          <div className="text-xs opacity-70">
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
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full p-6 lg:p-12 border-x overflow-hidden">
        <div className="flex flex-col justify-start items-start lg:col-span-7 min-w-0">
          <HeroPill />
          <HeroTitles />
          <HeroCTA />
        </div>
        <div className="lg:col-span-5 min-w-0">
          <TerminalPreview />
        </div>
      </div>
    </Section>
  );
}
