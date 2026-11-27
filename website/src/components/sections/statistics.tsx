"use client";

import { Section } from "@/components/section";
import { BorderText } from "@/components/ui/border-number";
import { siteConfig } from "@/lib/config";
import { CpuIcon, PackageIcon, ShieldCheckIcon } from "lucide-react";

const stats = [
  {
    title: "12 KB",
    subtitle: "Published Package Size",
    href: siteConfig.links.npm,
    icon: <PackageIcon className="h-5 w-5" />,
  },
  {
    title: "9+",
    subtitle: "Built-in AI Providers",
    href: "#providers",
    icon: <CpuIcon className="h-5 w-5" />,
  },
  {
    title: "0",
    subtitle: "Heavy Vendor SDKs",
    href: siteConfig.links.github,
    icon: <ShieldCheckIcon className="h-5 w-5" />,
  },
];

export function Statistics() {
  return (
    <Section id="statistics" title="By the Numbers">
      <div
        className="border-x border-t"
        style={{
          backgroundImage:
            "radial-gradient(circle at bottom center, hsl(var(--secondary) / 0.4), hsl(var(--background)))",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {stats.map((stat) => (
            <a
              href={stat.href}
              key={stat.subtitle}
              className="flex flex-col items-center justify-center py-8 px-4 border-b sm:border-b-0 last:border-b-0 sm:border-r sm:last:border-r-0 relative group overflow-hidden"
            >
              <div className="text-center relative">
                <BorderText text={stat.title} />
                <div className="flex items-center justify-center gap-2 mt-2">
                  {stat.icon}
                  <p className="text-sm text-muted-foreground">
                    {stat.subtitle}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </Section>
  );
}
