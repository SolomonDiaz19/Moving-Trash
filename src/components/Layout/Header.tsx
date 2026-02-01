"use client";

import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

const nav = [
  { href: "/dumpsters", label: "Dumpsters" },
  { href: "/service-areas", label: "About Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
        <Image
        src="/logo.png"
        alt="BBA Waste Hauling Services"
        width={652}
        height={279}
        priority
        className="h-14 w-auto md:h-20"

        />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
             className="text-sm font-semibold text-zinc-900 transition hover:text-red-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={site.phoneHref}
            className="text-sm font-semibold text-zinc-900 transition hover:text-red-600"
          >
            {site.phoneDisplay}
          </a>

          <Link
            href="/contact"
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Get Quote
          </Link>
        </div>
      </div>
    </header>
  );
}
