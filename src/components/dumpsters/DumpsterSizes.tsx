import Link from "next/link";
import { site } from "@/lib/site";

const dumpsters = [
  {
    size: "20 Yard",
    use: "Great for home cleanouts, small remodels, and light landscaping jobs.",
    bullets: ["Garage / Attic Cleanouts", "Small Demolition Projects", "Small Roofing Jobs"],
    highlight: "Most popular",
  },
  {
    size: "30 Yard",
    use: "Perfect for larger room renovations, construction debris, and big cleanouts.",
    bullets: ["Multi-Room Remodels", "Large Cleanouts", "Construction Debris"],
    highlight: "Big projects",
  },
  {
    size: "40 Yard",
    use: "Best for commercial jobs, major demo, and maximum capacity needs.",
    bullets: ["Commercial Demolition Jobs", "Commercial Building Cleanouts", "Complete Home Remodels"],
    highlight: "Maximum capacity",
  },
];

export default function DumpsterSizes() {
  return (
    <section className="border-b bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
          Compare dumpster sizes
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Need help choosing? Call {site.phoneDisplay} and we’ll recommend the best size.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dumpsters.map((d) => (
            <div
              key={d.size}
              className="rounded-3xl border-2 border-zinc-900 bg-white p-6 shadow-sm text-zinc-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-lg font-semibold text-zinc-900">{d.size}</div>
                <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                  {d.highlight}
                </div>
              </div>

              <p className="mt-3 text-sm text-zinc-600">{d.use}</p>

              <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                {d.bullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>

              <div className="mt-6 flex gap-3">
            <Link href="/contact"
                  className="inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
                >
                  Get Quote
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex rounded-xl border-2 border-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-900 hover:text-red-600 hover:border-red-600 transition"
                >
                  Ask a Question
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
