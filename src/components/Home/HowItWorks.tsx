const steps = [
  { title: "Tell us your project", desc: "Cleanup, remodel, roofing, construction, and MORE !!!." },
  { title: "We deliver the dumpster", desc: "reliable n quick." },
  { title: "We pick it up", desc: "Schedule pickup when you're done." },
];

export default function HowItWorks() {
  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl text-black">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s, idx) => (
            <div key={s.title} className="rounded-3xl border-2 border-zinc-900 p-6">
              <div className="text-sm font-semibold text-slate-600">STEP {idx + 1}</div>
              <div className="mt-2 text-lg font-semibold text-zinc-800">{s.title}</div>
              <div className="mt-2 text-sm text-slate-600">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
