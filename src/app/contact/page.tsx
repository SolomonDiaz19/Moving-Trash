import { site } from "@/lib/site";
import ContactHero from "@/components/contact/ContactHero";
import ContactForm from "@/components/contact/ContactForm";
import ContactInfo from "@/components/contact/ContactInfo";
import MapEmbed from "@/components/contact/MapEmbed";


export const metadata = {
  title: `Contact Us | ${site.name}`,
  description: "Request a quote, ask a question, or schedule delivery and pickup.",
};

export default function ContactPage() {
  return (
    <main className="bg-white">
      <ContactHero />

      <section className="border-b bg-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <ContactForm />
            <ContactInfo />
          </div>
        </div>
      </section>

      <MapEmbed />
    </main>
  );
}
