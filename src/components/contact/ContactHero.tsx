import { site } from "@/lib/site";

export default function ContactHero() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-sm font-semibold text-red-600">{site.promo}</p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
          Contact us for pricing & availability
        </h1>

        <p className="mt-4 max-w-2xl text-base text-zinc-600">
          Tell us about your project and we’ll recommend the right dumpster size.
          Prefer to call? We’re happy to help.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={site.phoneHref}
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 transition"
          >
            Call {site.phoneDisplay}
          </a>
          <a
            href="/dumpsters"
            className="inline-flex items-center justify-center rounded-xl border-2 border-zinc-900 px-5 py-3 font-semibold text-zinc-900 hover:border-red-600 hover:text-red-600 transition"
          >
            View dumpster sizes
          </a>
        </div>
      </div>
    </section>
  );
}
