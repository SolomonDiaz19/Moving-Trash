const cities = ["Dallas", "Fort Worth", "Arlington", "Plano", "Irving", "Garland", "Frisco", "McKinney"];

export default function ServiceAreas() {
  return (
    <section className="border-b bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl text-zinc-900">Service Areas</h2>
        <p className="mt-2 text-sm text-slate-600">
          We serve the Dallas–Fort Worth Metroplex.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {cities.map((c) => (
            <span key={c} className="rounded-full border-2 border-zinc-600 bg-white px-3 py-1 text-sm text-black">
              {c}
            </span>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white">
        <div className="aspect-[16/9] w-full">
        <iframe
        title="Service area map"
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps?q=Dallas-Fort%20Worth%20Metroplex&output=embed"
        />
        </div>
        </div>
      </div>
    </section>
  );
}
