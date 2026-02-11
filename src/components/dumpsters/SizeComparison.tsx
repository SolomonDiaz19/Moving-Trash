import Image from "next/image";

const rows = [
  { label: "Capacity", v20: "Medium", v30: "Large", v40: "Maximum" },
  { label: "Best for", v20: "Cleanouts / small remodels", v30: "Bigger remodels / debris", v40: "Commercial / demo" },
  { label: "Common jobs", v20: "Garage, small roofing", v30: "Renovations, construction", v40: "Major demo, commercial" },
];

export default function SizeComparison() {
  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
          Quick size comparison
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          These are general guidelines - your best size depends on debris type and volume.
        </p>

        {/* Softer container */}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-200 shadow-sm">
          <table className="min-w-[900px] w-full text-left text-sm text-zinc-900">
            
            {/* Header */}
            <thead className="bg-zinc-50">
              <tr className="[&>th]:px-8 [&>th]:py-4 [&>th]:font-semibold [&>th]:text-zinc-900 [&>th]:text-center text-xl md:text-2xl">
                <th className="w-[28%]"> </th>
                <th>20 Yard 22'L x 8'W x 4'5"H</th>
                <th>30 Yard 22'L x 8'W x 6'H</th>
                <th>40 Yard 22'L x 8'W x 8'H</th>
              </tr>
            </thead>

            {/* Body with zebra striping */}
            <tbody className="[&>tr:not(:last-child)]:border-b [&>tr:not(:last-child)]:border-zinc-200 [&>tr:nth-child(even)]:bg-zinc-50">

              {/* Photo row */}
              <tr className="[&>td]:px-4 [&>td]:py-2">
                <td className="align-middle text-center font-semibold text-zinc-900">
                  Example
                </td>

                {/* 20 Yard */}
                <td className="text-center">
                  <div className="mx-auto w-[190px] md:w-[220px] overflow-hidden rounded-2xl bg-white">
                    <Image
                      src="/Photos/Dumpstersize-20.png"
                      alt="20 yard dumpster"
                      width={302}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                </td>

                {/* 30 Yard */}
                <td className="text-center">
                  <div className="mx-auto w-[190px] md:w-[220px] overflow-hidden rounded-2xl bg-white">
                    <Image
                      src="/Photos/Dumpstersizes-30.png"
                      alt="30 yard dumpster"
                      width={302}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                </td>

                {/* 40 Yard */}
                <td className="text-center">
                  <div className="mx-auto w-[190px] md:w-[220px] overflow-hidden rounded-2xl bg-white">
                    <Image
                      src="/Photos/Dumpstersize-40.png"
                      alt="40 yard dumpster"
                      width={302}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                </td>
              </tr>

              {/* Data rows */}
              {rows.map((r) => (
                <tr key={r.label} className="[&>td]:px-4 [&>td]:py-3">
                  <td className="align-middle text-center font-bold text-zinc-900">
                    {r.label}
                  </td>
                  <td className="font-semibold text-center text-zinc-900">{r.v20}</td>
                  <td className="font-semibold text-center text-zinc-900">{r.v30}</td>
                  <td className="font-semibold text-center text-zinc-900">{r.v40}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-zinc-600">
          Tip: If you’re between sizes, going one size up can help avoid overflow or getting a second haul.
        </p>
      </div>
    </section>
  );
}
