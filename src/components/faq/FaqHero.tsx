import { site } from "@/lib/site";

export default function FaqHero() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-sm font-semibold text-red-600">Locally Owned • Reliable Service • Upfront Pricing</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
          Frequently asked questions
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-600">
          Quick answers to common questions about dumpster rentals, delivery, pickup, and what you can
          throw away. Still unsure? Call us and we’ll help.
        </p>

        <div className="mt-6">
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
