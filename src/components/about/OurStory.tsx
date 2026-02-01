import { site } from "@/lib/site";

export default function OurStory() {
  return (
    <section className="border-b bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
              Our story
            </h2>
            <p className="mt-4 text-zinc-600">
              {site.name} 
              Why you started the business?
              What does “family-owned” mean for your business? (Who’s involved, and how does that affect how you treat customers?)
              What sets BBA apart from other dumpster rental companies in DFW? (Speed, pricing, service, flexibility, communication, etc.)
              What’s most important to you when serving customers? (Reliability, honesty, respect for property, clear communication, etc.)
            </p>
            <p className="mt-4 text-zinc-600">
              "Insert more comments HERE"
            </p>
          </div>

          <div className="rounded-3xl border-2 border-zinc-900 bg-white p-6">
            <h3 className="text-lg font-semibold text-zinc-900">What you can expect</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-900">
              <li>• Clear, upfront pricing</li>
              <li>• Fast delivery and reliable pickup</li>
              <li>• Help choosing the right size</li>
              <li>• Local service across the DFW metroplex</li>
            </ul>

            <div className="mt-6 rounded-2xl bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-600">{site.promo}</p>
              <p className="mt-1 text-sm text-zinc-900">
                Ask about discounts when you call or request a quote.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
