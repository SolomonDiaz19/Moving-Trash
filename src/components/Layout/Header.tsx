"use client";

import { useEffect, useState } from "react";
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
  const [open, setOpen] = useState(false);

  // Close the mobile menu when resizing up to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false); // md breakpoint
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="BBA Waste Hauling Services"
              width={652}
              height={279}
              priority
              className="h-12 w-auto sm:h-14 md:h-20"
            />
          </Link>

          {/* Desktop nav */}
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

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Phone: hide on very small screens to avoid crowding */}
            <a
              href={site.phoneHref}
              className="hidden text-sm font-semibold text-zinc-900 transition hover:text-red-600 sm:inline"
            >
              {site.phoneDisplay}
            </a>

            <Link
              href="/contact"
              className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 sm:px-4"
            >
              Get Quote
            </Link>

            {/* Mobile hamburger */}
            <button 
            type="button"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
            >
              {open ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                  </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {open && (
          <div className="md:hidden pb-3">
            <div className="rounded-2xl border border-red-900 bg-white p-3 shadow-sm">
              {/* Phone shown here on mobile */}
              <a
                href={site.phoneHref}
                className="mb-2 block rounded-xl px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                onClick={() => setOpen(false)}
              >
                Call: {site.phoneDisplay}
              </a>

              <div className="h-px bg-zinc-200 my-2" />

              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
