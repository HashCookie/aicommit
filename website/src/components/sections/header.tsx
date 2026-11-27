"use client";

import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 h-[var(--header-height)] z-50 p-0 bg-background/60 backdrop-blur">
      <div className="flex justify-between items-center container max-w-[var(--container-max-width)] mx-auto px-4 py-2">
        <Link
          href="/"
          title="aicommit"
          className="relative mr-6 flex items-center space-x-2"
        >
          <Icons.logo className="w-6 h-6" />
          <span className="font-mono font-semibold text-lg">
            {siteConfig.name}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href={siteConfig.links.npm}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-8 rounded-lg font-mono text-sm"
            )}
          >
            npm
          </a>
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-8 bg-foreground text-background hover:bg-foreground/90 rounded-lg group tracking-tight font-medium flex items-center gap-1.5"
            )}
          >
            <Icons.github className="h-4 w-4" />
            {siteConfig.cta}
          </a>
        </div>
      </div>
      <hr className="absolute w-full bottom-0" />
    </header>
  );
}
