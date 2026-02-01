import Hero from "@/components/Home/Hero";
import TrustBar from "@/components/Home/TrustBar";
import DumpsterCards from "@/components/Home/DumpsterCards";
import HowItWorks from "@/components/Home/HowItWorks";
import ServiceAreas from "@/components/Home/ServiceAreas";
import FAQPreview from "@/components/Home/FAQPreview";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <DumpsterCards />
      <HowItWorks />
      <ServiceAreas />
      <FAQPreview />
    </>
  );
}
