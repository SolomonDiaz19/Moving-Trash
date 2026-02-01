import Link from "next/link";

const faqs = [
  { q: "How long can I keep the dumpster?", a: "idk." },
  { q: "What can I put in the dumpster?", a: "idk" },
  { q: "Do I need a permit?", a: " idk " },
];

export default function FAQPreview() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">FAQ</h2>
          <Link href="/faq" className="text-sm font-medium underline hover:underline transition hover:text-red-600">
            View all
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-3xl border-2 bg-white p-6">
              <div className="font-semibold text-zinc-900">{f.q}</div>
              <div className="mt-2 text-sm text-zinc-900">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
