import Image from "next/image";

const photos = [
  {
    src: "/Photos/dumpsterwork1.JPEG",
    alt: "Dumpster rental delivered to a driveway in DFW",
  },
  {
    src: "/Photos/dumpsterwork2.JPEG",
    alt: "20 yard dumpster for a home cleanout",
  },
  {
    src: "/Photos/dumpsterwork3.JPEG",
    alt: "Dumpsters on a job site for construction debris",
  },
  {
    src: "/Photos/dumpsterwork4.JPEG",
    alt: "Waste hauling pickup in the DFW metroplex",
  },
];

export default function AboutPhotos() {
  return (
    <section className="border-b bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
              Our work in the DFW metroplex
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Real deliveries, real projects - fast drop-off and reliable pickup.
            </p>
          </div>

          <a
            href="/contact"
            className="mt-4 inline-flex w-fit items-center justify-center rounded-xl border-2 border-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-900 hover:border-red-600 hover:text-red-600 transition md:mt-0"
          >
            Request a quote
          </a>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {photos.map((p) => (
            <div
              key={p.src}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="relative h-[220px] w-full">
                <Image
                src={p.src}
                alt={p.alt}
                width={1200}
                height={600}
                className="h-[220px] w-full object-cover"
                unoptimized
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
