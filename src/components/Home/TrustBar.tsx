const items = [
  { title: "Fast Drop-Off", desc: "On-time delivery & pickup" },
  { title: "Easy Ordering", desc: "Call or request a quote online" },
  { title: "Local Service", desc: "Friendly, reliable support" },
  { title: "Upfront Pricing", desc: "Clear rental terms" },
];

export default function TrustBar() {
  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 md:grid-cols-4">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="font-semibold text-zinc-900">{it.title}</div>
              <div className="mt-1 text-sm text-zinc-600">{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
