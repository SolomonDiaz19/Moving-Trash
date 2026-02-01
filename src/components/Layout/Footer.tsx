import Link from "next/link";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="text-lg font-bold text-zinc-900">{site.name}</div>
          <p className="mt-2 text-sm text-slate-600">
            Dumpster rentals throughout the Dallas–Fort Worth Metroplex.</p>. 
            <p className="mt text-sm text-slate-600">
              Quick Delivery, Great Pricing.
          </p>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-zinc-900">Links</div>
          <div className="mt-2 grid gap-2 text-slate-600">
            <Link href="/dumpsters" className="hover:underline transition hover:text-red-600">Dumpsters</Link>
            <Link href="/service-areas" className="hover:underline transition hover:text-red-600">Locations</Link>
            <Link href="/faq" className="hover:underline transition hover:text-red-600">FAQ</Link>
            <Link href="/contact" className="hover:underline transition hover:text-red-600">Contact Us</Link>
          </div>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-zinc-900">Contact</div>
          <div className="mt-2 text-slate-600">
            <a className="hover:underline transition hover:text-red-600" href={site.phoneHref}>{site.phoneDisplay}</a>
            <div className="mt-1">Email / address placeholders</div>
          </div>
        </div>
      </div>

      <div className="border-t py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
