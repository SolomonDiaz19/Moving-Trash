export default function MapEmbed() {
  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
          Service area
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Based in Ennis, TX - Proudly Serving the DFW Area
        </p>

        <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white">
          <div className="aspect-[16/9] w-full">
            <iframe
              title="Service area map"
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=800%20S%20I-45,%20Ennis,%20TX%2075119&z=9&output=embed"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
