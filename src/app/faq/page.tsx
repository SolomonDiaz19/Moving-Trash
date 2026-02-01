import { site } from "@/lib/site";
import FaqHero from "@/components/faq/FaqHero";
import FaqAccordion from "@/components/faq/FaqAccordion";
import FaqCta from "@/components/faq/FaqCta";

export const metadata = {
  title: `FAQ | ${site.name}`,
  description:
    "Find answers to common questions about dumpster rentals, scheduling, weight limits, and what can go in the dumpster.",
};

export default function FaqPage() {
  return (
    <main className="bg-white">
      <FaqHero />
      <FaqAccordion />
      <FaqCta />
    </main>
  );
}
