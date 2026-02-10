import Link from "next/link";

const faqs = [
  { q: "What item are NOT allowed", a:(
  <div>
    <p>Common restricted items include:</p>
    <ul className="mt-2 list-disc pl-5 space-y-1">
      <li>Paint & chemicals</li>
      <li>Oils & fuels</li>
      <li>Batteries</li>
      <li>Tires</li>
      <li>Asbestos</li>
      <li>Medical waste</li>
      <li>Propane tanks</li>
      <li>Some electronics</li>
    </ul>
    <p className="mt-2">Rules may vary — ask first.</p>
  </div>
) },
  { q: "How much does a dumpster rental cost?", a: "Pricing depends on the dumpster size, rental lenght, delivery location (DFW), disposal fees, and weight. The fastest way to get an exact total is to request a quote with your zip code and the size you need." },
  { q: "How does booking work?", a: " Customers submit a rental request online. We review availability and confirm delivery dates before finalizing the reservation. You will receive an email once your request is approved. " },
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
