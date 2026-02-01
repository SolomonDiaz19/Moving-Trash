"use client";

import { useState } from "react";
import { site } from "@/lib/site";

const faqs = [
  {
    q: "What dumpster sizes do you offer?",
    a: `We offer ${site.featuredSizes.join(", ")} dumpsters. If you’re not sure which size you need, call us and we’ll recommend the best option for your project.`,
  },
  {
    q: "How long can I keep the dumpster?",
    a: "Most rentals include a standard rental period. If you need extra time, let us know—we can usually extend the rental based on availability.",
  },
  {
    q: "How is pricing determined?",
    a: "Pending answer",
  },
  {
    q: "Do you offer same day or next day delivery?",
    a: "In most cases yes! depending on availability. Contact us with your preferred delivery date and we'll do our best to accomodate.",
  },
  {
    q: "What can I put in the dumpster?",
    a: "Pending answer",
  },
  {
    q: "What items are not allowed?",
    a: "Pending Answer",
  },
  {
    q: "Do I need a permit?",
    a: "Pending answer",
  },
  {
    q: "Is there a weight limit?",
    a: "Pending answer",
  },
  {
    q: "What happens If I overfill the dumpster?",
    a: "Pending answer",
  },
  {
    q: "How do I schedule a pickup?",
    a: "When you are ready, call or message us to schedule a pickup. We'll confirm a pickup window and haul it away.",
  },
  {
    q: "Do you offer discounts?",
    a: "Yes! There are Veterans, Seniors, & Teachers discounts. Please mention it when you call or request a quote.",
  },
  
];

export default function FaqAccordion() {
  const [openQ, setOpenQ] = useState<string | null>(null);

  return (
    <section className="border-b bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-3xl border-2 border-zinc-500 bg-white">
          {faqs.map((item) => {
            const isOpen = openQ === item.q;

            return (
              <details
                key={item.q}
                open={isOpen}
                className="group border-b border-zinc-200 last:border-b-0 px-5 sm:px-7"
              >
                <summary
                  className="cursor-pointer list-none py-5 text-left"
                  onClick={(e) => {
                    e.preventDefault(); // stop native toggle
                    setOpenQ((prev) => (prev === item.q ? null : item.q));
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-semibold text-zinc-900">
                      {item.q}
                    </span>
                    <span className="text-zinc-900 transition-transform group-open:rotate-180">
                      ▼
                    </span>
                  </div>
                </summary>

                <div className="pb-5">
                  <p className="text-sm text-zinc-600">{item.a}</p>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
