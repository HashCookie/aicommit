import { CTA } from "@/components/sections/cta";
import { Examples } from "@/components/sections/examples";
import { Features } from "@/components/sections/features";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { Logos } from "@/components/sections/logos";
import { Statistics } from "@/components/sections/statistics";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Logos />
      <Examples />
      <Features />
      <Statistics />
      <CTA />
      <Footer />
    </main>
  );
}
