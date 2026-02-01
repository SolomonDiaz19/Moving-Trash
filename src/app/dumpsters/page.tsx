import { site } from "@/lib/site";
import Link from "next/link";
import DumpsterSizes from "@/components/dumpsters/DumpsterSizes";
import SizeComparison from "@/components/dumpsters/SizeComparison";
import DumpstersCta from "@/components/dumpsters/DumpstersCta";

export const metadata = {
  title: `Dumpster Sizes | ${site.name}`,
  description: "Explore 20, 30, and 40 yard dumpster rentals and choose the right size for your project.",
};

export default function DumpstersPage() {
  return (
    <main className="bg-white">
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <p className="text-sm font-semibold text-red-600">Ask About Our Discounts!</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
            Dumpster sizes for projects across the DFW metroplex
          </h1>
          <p className="mt-4 max-w-2xl text-base text-zinc-600">
            Choose from {site.featuredSizes.join(", ")} dumpsters. Not sure which size you need?
            Call us and we’ll recommend the best option based on your project.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-white font-semibold hover:bg-red-700 transition">
               Get Quote
            </Link>
            <a
              href={site.phoneHref}
              className="inline-flex items-center justify-center rounded-xl border-2 border-zinc-900 px-5 py-3 text-zinc-900 font-semibold hover:text-red-600 hover:border-red-600 transition"
            >
              Call {site.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      <DumpsterSizes />
      <SizeComparison />
      <DumpstersCta />
    </main>
  );
}
