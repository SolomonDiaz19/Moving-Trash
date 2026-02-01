import Link from "next/link";

const dumpsters = [
  { size: "20 Yard", use: "Remodeling, roofing, medium cleanouts", highlight: "Most Popular" },
  { size: "30 Yard", use: "Construction debris, large cleanouts", highlight: "Big Projects" },
  { size: "40 Yard", use: "Commercial jobs, major demo", highlight: "Maximum Capacity" },
];


export default function DumpsterCards() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Choose the right dumpster size
            </h2>
            <p className="mt-2 text-sm text-zinc-300">
              Not sure? We’ll recommend a size based on your project.
            </p>
          </div>
          <Link href="/dumpsters" className="hidden text-sm font-medium underline md:inline hover:underline transition hover:text-red-600">
            View all sizes
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dumpsters.map((d) => (
            <div key={d.size} className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900">
              <div className="text-lg font-semibold">{d.size}</div>
              <div className="mt-2 text-sm text-zinc-600">{d.use}</div>
              <div className="mt-4 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                {d.highlight}
              </div>
              <div className="mt-6">
                <Link
                  href="/contact"
                  className="inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Get Quote
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
