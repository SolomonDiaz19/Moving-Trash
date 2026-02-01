import { site } from "@/lib/site";

const hours = [
  { day: "Monday", time: "8:00 AM – 6:00 PM" },
  { day: "Tuesday", time: "8:00 AM – 6:00 PM" },
  { day: "Wednesday", time: "8:00 AM – 6:00 PM" },
  { day: "Thursday", time: "8:00 AM – 6:00 PM" },
  { day: "Friday", time: "8:00 AM – 6:00 PM" },
  { day: "Saturday", time: "Closed" },
  { day: "Sunday", time: "Closed" },
];

export default function ContactInfo() {
  return (
    <aside className="rounded-3xl border-2 border-zinc-900 bg-white p-6">
      <h2 className="text-xl font-semibold text-zinc-900">Contact info</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Serving the DFW metroplex. Call or send a request and we’ll respond as soon as possible.
      </p>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">Phone</p>
          <a
            href={site.phoneHref}
            className="mt-1 inline-block text-sm font-semibold text-red-600 hover:text-red-700"
          >
            {site.phoneDisplay}
          </a>
        </div>

        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">Hours</p>
          <div className="mt-2 space-y-1 text-sm text-zinc-900">
            {hours.map((h) => (
              <div key={h.day} className="flex items-center justify-between gap-4">
                <span className="font-medium">{h.day}</span>
                <span>{h.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-600">{site.promo}</p>
          <p className="mt-1 text-sm text-zinc-800">
            Mention it when you call or submit the form.
          </p>
        </div>
      </div>
    </aside>
  );
}
