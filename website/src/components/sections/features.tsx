import { Section } from "@/components/section";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Features() {
  const services = siteConfig.features;
  return (
    <Section id="features" title="Features">
      <div className="border-x border-t">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ name, description, icon: Icon }, index) => (
            <div
              key={name}
              className={cn(
                "flex flex-col gap-y-3 items-center justify-center py-9 px-6 border-b transition-colors hover:bg-muted/30",
                "last:border-b-0",
                "md:[&:nth-child(2n+1)]:border-r md:[&:nth-child(n+5)]:border-b-0",
                "lg:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(n+4)]:border-b-0 lg:border-r",
                index === services.length - 1 ? "border-b-0" : ""
              )}
            >
              <div className="flex flex-col gap-y-3 items-center">
                <div className="border bg-muted/70 p-2.5 rounded-lg text-foreground">
                  {Icon}
                </div>
                <h2 className="text-lg font-semibold text-foreground text-center text-balance">
                  {name}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground text-balance text-center max-w-xs mx-auto leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
