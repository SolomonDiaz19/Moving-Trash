import { site } from "@/lib/site";
import Link from "next/link";

export default function AboutCta() {
  return (
    <section className="bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-3xl border-2 border-zinc-700 bg-zinc-900 p-8 md:p-10">
          <p className="text-sm font-semibold text-red-500">{site.promo}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
            Ready to schedule your dumpster?
          </h3>
          <p className="mt-3 max-w-2xl text-sm text-zinc-900">
            Tell us your project and we’ll recommend the right dumpster size and schedule delivery.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={site.phoneHref}
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              Call {site.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
