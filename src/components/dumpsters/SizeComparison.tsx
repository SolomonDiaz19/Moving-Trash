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

        <div className="mt-8 overflow-hidden rounded-3xl border-2 px-4 border-zinc-900 pt-2 pb-10">
          <table className="w-full text-left text-sm text-zinc-900">    
            <thead className="bg-zinc-50">
              <tr className="[&>th]:px-8 [&>th]:py-5 [&>th]:font-semibold [&>th]:text-zinc-900 [&>th]:text-center text-lg">
                <th className="w-[28%]"> </th>
                <th>20 Yard (Insert dimensions) </th>
                <th>30 Yard (Insert dimensions) </th>
                <th>40 Yard (Insert dimensions) </th>
              </tr>
            </thead>
            <tbody className="[&>tr:not(:last-child)]:border-b [&>tr:not(:last-child)]:border-zinc-200">
  {/* Photo row */}
  <tr className="[&>td]:px-4 [&>td]:py-4">
    <td className="align-middle text-center text-medium font-semibold text-zinc-900">Example</td>

    <td>
  <div className="mx-auto w-[160px] overflow-hidden rounded-3xl border border-white bg-white">
    <Image
      src="/photos/Dumpstersize-20.png"
      alt="20 yard dumpster"
      width={302}
      height={40}
      className="object-cover"
    />
  </div>
</td>

   <td>
  <div className="mx-auto w-[160px] overflow-hidden rounded-3xl border border-white bg-white">
    <Image
      src="/photos/Dumpstersizes-30.png"
      alt="20 yard dumpster"
      width={302}
      height={40}
      className="object-cover"
    />
  </div>
</td>

    <td>
  <div className="mx-auto w-[160px] overflow-hidden rounded-2xl border border-white bg-white">
    <Image
      src="/photos/Dumpstersize-40.png"
      alt="20 yard dumpster"
      width={302}
      height={40}
      className="object-cover"
    />
  </div>
</td>
  </tr>

  {/* Data rows */}
  {rows.map((r) => (
    <tr key={r.label} className="[&>td]:px-4 [&>td]:py-4">
      <td className="align-middle text-center text-medium font-bold text-zinc-900 ">{r.label}</td>
      <td className=" font-semibold text-center text-zinc-900">{r.v20}</td>
      <td className=" font-semibold text-center text-zinc-900">{r.v30}</td>
      <td className=" font-semibold text-center text-zinc-900">{r.v40}</td>
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
