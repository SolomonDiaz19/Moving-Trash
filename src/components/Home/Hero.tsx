import Link from "next/link";
import { site } from "@/lib/site";
import PhotoCarousel from "@/components/Home/PhotoCarousel";



export default function Hero() {
  return (
    <section className="relative bg-white pt-2">
      {/* subtle background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-red-600/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-red-600/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-[75rem] gap-10 px-4 pt-4 pb-10 md:grid-cols-2 md:pt-6 md:pb-16">
        <div className="space-y-5">
          {/* discount badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
            {site.promo}
          </div>

          <p className="text-sm font-medium text-slate-600">
            Dallas–Fort Worth Metroplex • Quick Delivery • Great Prices
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            40–30–20 Yard <span className="text-red-600">Dumpsters</span>
          </h1>

          <p className="text-base text-slate-600 md:text-lg">
            Affordable dumpster rentals across the Dallas–Fort Worth Metroplex. Fast delivery, 
            transparent pricing, and flexible rental periods for home and construction projects.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              Get a Quote
            </Link>

            <a
              href={site.phoneHref}
              className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Call or Text {site.phoneDisplay}
            </a>
          </div>

          {/* quick trust boxes */}
          <div className="grid grid-cols-1 gap-3 pt-4 text-xs text-slate-600 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="font-semibold text-slate-900">Request a Quote</div>
              <div>Simple Online Form</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="font-semibold text-slate-900">Check Availability</div>
              <div>We Confirm Quickly</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="font-semibold text-slate-900">Submit Request</div>
              <div>Fast Email Confirmation</div>
            </div>
          </div>
        </div>
        
        
        <PhotoCarousel
        photos={[
          { src: "/Photos/Dumpsters-2.jpg", alt: "Truck delivering a dumpster" },
          { src: "/Photos/Dumpsterhouse.JPEG", alt: "Truck delivering a dumpster" },
          { src: "/Photos/truck-3.JPEG", alt: "Truck delivering a dumpster" },
          { src: "/Photos/Truck-1.JPEG", alt: "Truck delivering a dumpster" },
          { src: "/Photos/Dumpsters-1.JPEG", alt: "Multiple dumpsters on a job site" },
          { src: "/Photos/Truck-2.JPEG", alt: "Dumpsters and truck on a job site" },
          ]}
          />

      </div>
    </section>
  );
}
