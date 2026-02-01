import { site } from "@/lib/site";

export default function AboutHero() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-sm font-semibold text-red-600">Proudly Serving Our Local Community</p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
          Local dumpster rental & waste hauling across the DFW metroplex
        </h1>

        <p className="mt-4 max-w-2xl text-base text-zinc-600">
          BBA Waste Hauling Services is a local, family-owned dumpster rental company serving the Dallas-Fort Worth Metroplex. 
          We offer fast, same-day delivery with clear pricing and dependable pickup. From home cleanouts and remodels to roofing 
          and construction projects, our team helps you choose the right dumpster to keep your job moving.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={site.phoneHref}
            className="inline-flex items-center justify-center rounded-xl border-2 border-zinc-900 px-5 py-3 font-semibold text-zinc-900 hover:border-red-600 hover:text-red-600 transition"
          >
            Call {site.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
