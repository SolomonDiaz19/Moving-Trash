"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { site } from "@/lib/site";

const projectTypes = [
  "Home cleanout",
  "Remodel",
  "Roofing",
  "Construction",
  "Commercial",
  "Other",
] as const;

const sizes = ["20 Yard", "30 Yard", "40 Yard", "Not sure"] as const;

type FormState = {
  name: string;
  phone: string;
  email: string;
  city: string;
  projectType: (typeof projectTypes)[number] | "";
  size: (typeof sizes)[number] | "";
  dateNeeded: string; // YYYY-MM-DD
  details: string;

  // ✅ Honeypot (bots often fill hidden fields)
  companyWebsite: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// yyyy-mm-dd helpers (date-only, stable)
function todayISO() {
  const dt = new Date();
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function addDaysISO(startISO: string, days: number) {
  const [y, m, d] = startISO.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function isoToDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function dateToISO(d: Date) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Weekend helper
function isWeekend(date: Date) {
  const day = date.getDay(); // 0=Sun ... 6=Sat
  return day === 0 || day === 6;
}

function isWeekendISO(iso: string) {
  return isWeekend(isoToDate(iso));
}

function bumpToNextWeekdayISO(iso: string) {
  let cur = iso;
  while (isWeekendISO(cur)) cur = addDaysISO(cur, 1);
  return cur;
}

// Pickup = start + durationDays, bumped off weekend
function computePickupISO(startISO: string, durationDays: number) {
  const candidate = addDaysISO(startISO, durationDays);
  return bumpToNextWeekdayISO(candidate);
}

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    city: "",
    projectType: "",
    size: "",
    dateNeeded: "",
    details: "",
    companyWebsite: "", // ✅
  });

  // Popout calendar
  const [isCalOpen, setIsCalOpen] = useState(false);
  const calWrapRef = useRef<HTMLDivElement | null>(null);

  // Hover preview
  const [hoverISO, setHoverISO] = useState<string>("");

  // Duration UX: 7 default
  const [extended, setExtended] = useState(false);
  const [durationDays, setDurationDays] = useState<number>(7);
  const durationOptions = useMemo(() => Array.from({ length: 7 }, (_, i) => i + 8), []);

  // Availability data
  const [availableStartDates, setAvailableStartDates] = useState<Set<string>>(new Set());
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const pickupDate = useMemo(() => {
    if (!form.dateNeeded) return "";
    return computePickupISO(form.dateNeeded, durationDays);
  }, [form.dateNeeded, durationDays]);

  const highlightRange = useMemo(() => {
    if (!form.dateNeeded) return undefined;
    const from = isoToDate(form.dateNeeded);

    const pickup = computePickupISO(form.dateNeeded, durationDays);
    const lastOnsite = addDaysISO(pickup, -1);
    const to = isoToDate(lastOnsite);

    return { from, to };
  }, [form.dateNeeded, durationDays]);

  const previewRange = useMemo(() => {
    if (form.dateNeeded) return undefined;
    if (!hoverISO) return undefined;

    const from = isoToDate(hoverISO);

    const pickup = computePickupISO(hoverISO, durationDays);
    const lastOnsite = addDaysISO(pickup, -1);
    const to = isoToDate(lastOnsite);

    return { from, to };
  }, [form.dateNeeded, hoverISO, durationDays]);

  const selectedRange = highlightRange ?? previewRange;

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Please enter your name.";
    if (!form.phone.trim()) e.phone = "Please enter your phone number.";
    if (!form.city.trim()) e.city = "Please enter your city (DFW area).";
    if (!form.projectType) e.projectType = "Please select a project type.";
    if (!form.size) e.size = "Please select a dumpster size.";
    if (!form.email.trim()) e.email = "Please enter your email address.";
    else if (!isValidEmail(form.email)) e.email = "Please enter a valid email address.";
    if (!form.dateNeeded) e.dateNeeded = "Please choose a start date.";
    return e;
  }, [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleExtendedToggle(checked: boolean) {
    setExtended(checked);
    setDurationDays(checked ? 8 : 7);
  }

  // Close calendar on Escape / outside click
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsCalOpen(false);
    }
    function onMouseDown(e: MouseEvent) {
      if (!calWrapRef.current) return;
      if (!calWrapRef.current.contains(e.target as Node)) setIsCalOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  const todayStr = useMemo(() => todayISO(), []);
  const todayDate = useMemo(() => isoToDate(todayStr), [todayStr]);
  const maxDateStr = useMemo(() => addDaysISO(todayStr, 90), [todayStr]);
  const maxDate = useMemo(() => isoToDate(maxDateStr), [maxDateStr]);

  // Fetch availability whenever size or duration changes
  useEffect(() => {
    async function run() {
      setAvailabilityError(null);

      if (!form.size || form.size === "Not sure") {
        setAvailableStartDates(new Set());
        return;
      }

      setLoadingAvailability(true);
      try {
        const params = new URLSearchParams({
          size: form.size,
          duration: String(durationDays),
          days: "90",
        });

        const res = await fetch(`/api/availability?${params.toString()}`);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setAvailableStartDates(new Set());
          setAvailabilityError(data?.detail || data?.error || "Failed to load availability.");
          return;
        }

        setAvailableStartDates(new Set(Array.isArray(data?.available) ? data.available : []));
      } catch {
        setAvailableStartDates(new Set());
        setAvailabilityError("Failed to load availability.");
      } finally {
        setLoadingAvailability(false);
      }
    }

    run();
  }, [form.size, durationDays]);

  // If selected date becomes unavailable, clear it
  useEffect(() => {
    if (!form.dateNeeded) return;
    if (availableStartDates.size === 0) return;
    if (!availableStartDates.has(form.dateNeeded)) update("dateNeeded", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableStartDates]);

  // Disabled days
  const disabled = useMemo(() => {
    const base: any[] = [{ before: todayDate }, { after: maxDate }];
    base.push((date: Date) => isWeekend(date));

    if (!form.size || form.size === "Not sure" || loadingAvailability) return base;

    if (availableStartDates.size === 0) {
      return [...base, { after: todayDate, before: maxDate }];
    }

    const disabledDays: Date[] = [];
    for (let i = 0; i <= 90; i++) {
      const iso = addDaysISO(todayStr, i);
      if (!availableStartDates.has(iso)) disabledDays.push(isoToDate(iso));
    }
    return [...base, ...disabledDays];
  }, [availableStartDates, form.size, loadingAvailability, maxDate, todayDate, todayStr]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(errors).length > 0) return;

    if (!form.size || form.size === "Not sure") {
      alert("Please select a dumpster size (20, 30, or 40 Yard).");
      return;
    }

    if (availableStartDates.size > 0 && !availableStartDates.has(form.dateNeeded)) {
      alert("That start date is no longer available. Please choose another.");
      return;
    }

    if (form.dateNeeded) {
      const d = isoToDate(form.dateNeeded);
      if (isWeekend(d)) {
        alert("Weekend start dates are not available. Please choose a weekday.");
        return;
      }
    }

    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dumpsterSize: form.size,
          startDate: form.dateNeeded,
          durationDays,
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.city,
          notes: `Project: ${form.projectType}\n${form.details}`,
          companyWebsite: form.companyWebsite, // ✅ send honeypot
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Request failed:", data);
        alert(data?.detail || data?.error || "Request failed.");
        return;
      }

      if (data.available === false) {
        alert("Not available for those dates. Please try different dates.");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Submit error:", err);
      alert("Something went wrong. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border-2 border-zinc-900 bg-white p-4 w-full">
        <h2 className="text-xl font-semibold text-zinc-900">Request received</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Thanks! We’ll reach out soon using the contact info you provided. If you need immediate help,
          call {site.phoneDisplay}.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={site.phoneHref}
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 transition"
          >
            Call {site.phoneDisplay}
          </a>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="inline-flex items-center justify-center rounded-xl border-2 border-zinc-900 px-5 py-3 font-semibold text-zinc-900 hover:border-red-600 hover:text-red-600 transition"
          >
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  const dayBase = "h-11 w-11 rounded-full font-semibold !text-zinc-900 transition cursor-pointer";
  const hoverBlue = "hover:border-blue-400 hover:bg-blue-100/80";

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border-2 border-zinc-900 bg-white p-6">
      <h2 className="text-xl font-semibold text-zinc-900">Request a quote</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Fill this out and we’ll recommend the best dumpster size for your project.
      </p>

      {/* ✅ Honeypot MUST be inside the form + in state */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
      >
        <label htmlFor="companyWebsite">Company Website</label>
        <input
          id="companyWebsite"
          name="companyWebsite"
          type="text"
          autoComplete="off"
          tabIndex={-1}
          value={form.companyWebsite}
          onChange={(e) => update("companyWebsite", e.target.value)}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* --- keep your existing fields --- */}
        {/* (I’m keeping your original JSX below unchanged as much as possible) */}

        <Field label="Name" error={errors.name}>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-600 text-zinc-900"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Your name"
          />
        </Field>

        <Field label="Phone" error={errors.phone}>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-600 text-zinc-900"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="(469) 716-3877"
          />
        </Field>

        <Field label="Email" error={errors.email}>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-600 text-zinc-900"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@email.com"
          />
        </Field>

        <Field label="City" error={errors.city}>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-600 text-zinc-900"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Dallas, Fort Worth, Arlington..."
          />
        </Field>

        <Field label="Project type" error={errors.projectType}>
          <select
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-600 text-zinc-900"
            value={form.projectType}
            onChange={(e) => update("projectType", e.target.value as any)}
          >
            <option value="">Select one…</option>
            {projectTypes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Dumpster size" error={errors.size}>
          <select
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-600 text-zinc-900"
            value={form.size}
            onChange={(e) => update("size", e.target.value as any)}
          >
            <option value="">Select one…</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        {/* --- your calendar + duration + details blocks stay the same --- */}
        {/* I’m not re-pasting the full calendar JSX again to keep this message readable. */}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 transition"
        >
          Send request
        </button>
        <a
          href={site.phoneHref}
          className="inline-flex items-center justify-center rounded-xl border-2 border-zinc-900 px-5 py-3 font-semibold text-zinc-900 hover:border-red-600 hover:text-red-600 transition"
        >
          Prefer to call? {site.phoneDisplay}
        </a>
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        By submitting, you agree we may contact you about scheduling and pricing.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-900">{label}</span>
        {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

