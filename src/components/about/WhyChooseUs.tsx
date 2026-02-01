const reasons = [
  {
    title: "Upfront pricing",
    desc: "Clear rental terms with no confusing surprises.",
  },
  {
    title: "Fast scheduling",
    desc: "Quick delivery options to keep your project moving.",
  },
  {
    title: "Reliable pickup",
    desc: "Schedule pickup when you’re done—we’ll be there.",
  },
  {
    title: "Local DFW service",
    desc: "Serving Dallas–Fort Worth with friendly support.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
          Why choose us
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Simple process, dependable service, and a team that picks up the phone.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((r) => (
            <div
              key={r.title}
              className="rounded-3xl border-2 border-zinc-900 bg-white p-6"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-600" />
                <div>
                  <h3 className="font-semibold text-zinc-900">{r.title}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{r.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
