import { site } from "@/lib/site";
import AboutHero from "@/components/about/AboutHero";
import OurStory from "@/components/about/OurStory";
import WhyChooseUs from "@/components/about/WhyChooseUs";
import AboutCta from "@/components/about/AboutCta";
import Values from "@/components/about/AboutPhotos";

export const metadata = {
  title: `About Us | ${site.name}`,
  description:
    "Learn more about our local dumpster rental and waste hauling team serving the DFW metroplex.",
};

export default function AboutPage() {
  return (
    <main className="bg-white">
      <AboutHero />
      <OurStory />
      <WhyChooseUs />
      <AboutCta />
      <Values />
    </main>
  );
}
