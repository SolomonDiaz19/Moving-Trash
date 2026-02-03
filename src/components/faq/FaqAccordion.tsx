"use client";

import { useState } from "react";
import { site } from "@/lib/site";

const faqs = [
  {
    q: "What dumpster sizes do you offer?",
    a: `We offer ${site.featuredSizes.join(", ")} dumpsters. If you tell us what you're tossing (and how much), we'll help you pick the right size.`,
  },
{
    q: "How much does a dumpster rental cost?",
    a: "Pricing depends on the dumpster size, rental lenght, delivery location (DFW), disposal fees, and weight. The fastest way to get an exact total is to request a quote with your zip code and the size you need.",
  },

  {
    q: "What's included in the rental price?",
    a: "In most cases: Drop-off, pickup, a set rental period, and disposal up to an included weight allowance. Overages (extra weight, extended time, special materials) may add cost.",
  },
  {
    q: "How long can I keep the dumpster",
    a: "Rentals include a standard rental period (varies by jobs). If you need more time, let us know! extensions are usually available.",
  },
  {
    q: "Do you offer same-day or next-day delivery in DFW?",
    a: "Sometimes - availability depends on the schedule and your location. The earlier you book, the better.",
  },
  {
    q: "What is the delivery window?",
    a: "We provide an estimated arrival window for delivery and pickup. Traffic/route timing can shift, but we communicate if anything changes.",
  },
  {
    q: "Do I need to be home when the dumpster is delivered?",
    a: "Not always. You can leave clear placement instuctions (driveway side, gate code, etc.) and ensure acess.",
  },
  {
    q: "Where can you place a dumpster",
    a: "Usually a driveway or jobsite area with enough clearance. We need a clear, flat spot and room for the truck.",
  },
  {
    q: "Will the dumpster damage my driveway?",
    a: "We place carefully, but dumpsters are heave. If concerned, use boards/plywood under the wheels and avoid soft surfaces.",
  },
  {
    q: "Do I need a permit?",
    a: "Private property: usually no.     Street/alley/right-of-way:may require a permit depending on city. We can help confirm.",
  },
  {
    q: "What can I put in the dumpster?",
    a: "Most cleanup/construction debris: wood, drywall, flooring, furniture, junk, roofing debris, general construction waste.",
  },
  {
    q: "What item are NOT allowed",
    a: "Common restricted items: paint/chemicals, oils/fuels, batteries, tires, abestos, medical waste, propane tanks, some electronics. Rules may vary - Ask first.",
  },
  {
    q: "Is there a weigh limit?",
    a: "Yes, each size includes a weight allowance. Heavy materials (concrete, dirt, shingles, brick, tile) add up fast. Please tell us what you're dumping.",
  },
  {
    q: "Concrete/dirt/shingles allowed?",
    a: "Sometimes, but they're heavy and may need special pricing or fill limits. Tell us ahead of time.",
  },
  {
    q: "How full can I load it?",
    a: "Load level with the top edge (not piled above the rim) so we can tarp and haul safely.",
  },
  {
    q: "How do I schedule pickup?",
    a: "Call/text or book pickup through the side. Make sure the area is accessible.",
  },
  {
    q: "Can I extend or swap sizes?",
    a: "Yes, extensions and swaps are usually possible depending on availability.",
  },
  {
    q: "Additional haul (dump and return)?",
    a: "Yes, common for contractors. We can pick up a full dumpster and drop an empty one (Depending on availablility).",
  },
  {
    q: "How far in advance should I book?",
    a: "As early as possible, especially for large projects. Please reach out if its urgent.",
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
