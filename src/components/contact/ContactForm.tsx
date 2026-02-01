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
};

{/* Honeypot (bots often fill hidden fields) */}
<div style={{ position: "absolute", left: "-9999px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
  <label htmlFor="companyWebsite">Company Website</label>
  <input
    id="companyWebsite"
    name="companyWebsite"
    type="text"
    autoComplete="off"
    tabIndex={-1}
  />
</div>

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

//  NEW helpers: weekend-safe pickup
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
  });

  // Popout calendar
  const [isCalOpen, setIsCalOpen] = useState(false);
  const calWrapRef = useRef<HTMLDivElement | null>(null);

  // Hover preview (outline circle only)
  const [hoverISO, setHoverISO] = useState<string>("");

  // Duration UX: 7 default, checkbox unlocks 8–14 total duration
  const [extended, setExtended] = useState(false);
  const [durationDays, setDurationDays] = useState<number>(7);
  const durationOptions = useMemo(
    () => Array.from({ length: 7 }, (_, i) => i + 8), // 8–14
    []
  );

  // Availability data
  const [availableStartDates, setAvailableStartDates] = useState<Set<string>>(new Set());
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  //  Pickup date (weekday-only)
  const pickupDate = useMemo(() => {
    if (!form.dateNeeded) return "";
    return computePickupISO(form.dateNeeded, durationDays);
  }, [form.dateNeeded, durationDays]);

  //  Highlight range = dumpster onsite (inclusive): start -> day BEFORE pickup
  const highlightRange = useMemo(() => {
    if (!form.dateNeeded) return undefined;
    const from = isoToDate(form.dateNeeded);

    const pickup = computePickupISO(form.dateNeeded, durationDays);
    const lastOnsite = addDaysISO(pickup, -1);
    const to = isoToDate(lastOnsite);

    return { from, to };
  }, [form.dateNeeded, durationDays]);

  // Preview range when hovering (before selection)
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

  // Basic validation
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

  // Calendar bounds
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
          duration: String(durationDays), //  requested duration (server bumps pickup)
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

  // If user selected a date and later it becomes unavailable, clear it
  useEffect(() => {
    if (!form.dateNeeded) return;
    if (availableStartDates.size === 0) return;
    if (!availableStartDates.has(form.dateNeeded)) update("dateNeeded", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableStartDates]);

  // Disabled days: outside [today, max] + weekends + unavailable days (once loaded)
  const disabled = useMemo(() => {
    const base: any[] = [{ before: todayDate }, { after: maxDate }];

    // Disable weekends always (start dates cannot be weekends)
    base.push((date: Date) => isWeekend(date));

    if (!form.size || form.size === "Not sure" || loadingAvailability) return base;

    if (availableStartDates.size === 0) {
      // Disable all selectable days in the window
      return [...base, { after: todayDate, before: maxDate }];
    }

    // Disable any day in window that is NOT available
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

    if (form.size === "" || form.size === "Not sure") {
      alert("Please select a dumpster size (20, 30, or 40 Yard).");
      return;
    }

    // Extra safety
    if (availableStartDates.size > 0 && !availableStartDates.has(form.dateNeeded)) {
      alert("That start date is no longer available. Please choose another.");
      return;
    }

    // Prevent weekend start dates even if something slips through
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
          durationDays, //  requested duration (server will compute weekday pickup)
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.city,
          notes: `Project: ${form.projectType}\n${form.details}`,
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

  const dayBase =
    "h-11 w-11 rounded-full font-semibold !text-zinc-900 transition cursor-pointer";
  const hoverBlue = "hover:border-blue-400 hover:bg-blue-100/80";

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border-2 border-zinc-900 bg-white p-6">
      <h2 className="text-xl font-semibold text-zinc-900">Request a quote</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Fill this out and we’ll recommend the best dumpster size for your project.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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

        <div className="sm:col-span-2">
          <Field label="Start date" error={errors.dateNeeded}>
            <div ref={calWrapRef} className="relative">
              <button
                type="button"
                onClick={() => setIsCalOpen((v) => !v)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-left shadow-sm hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <div className="flex items-center justify-between">
                  <span className={form.dateNeeded ? "text-zinc-900" : "text-zinc-400"}>
                    {form.dateNeeded ? form.dateNeeded : "Select a start date"}
                  </span>
                  <span className="text-zinc-500">📅</span>
                </div>

                {form.dateNeeded && (
                  <div className="mt-1 text-xs text-zinc-600">
                    Estimated pickup: <b>{pickupDate}</b> ({durationDays} day rental)
                  </div>
                )}
              </button>

              {isCalOpen && (
                <div className="absolute left-1/2 z-50 mt-2 w-[380px] max-w-[92vw] -translate-x-1/2 rounded-2xl border-2 border-black bg-white p-6 shadow-xl">
                  {!form.size || form.size === "Not sure" ? (
                    <div className="text-sm text-zinc-700">
                      Select a dumpster size first to see availability.
                    </div>
                  ) : (
                    <DayPicker
                      className="w-full"
                      showOutsideDays
                      numberOfMonths={1}
                      mode="range"
                      selected={selectedRange}
                      onSelect={() => {}}
                      onDayClick={(d, modifiers) => {
                        if (!d) return;
                        if (modifiers.disabled) return;
                        if (isWeekend(d)) return;

                        const iso = dateToISO(d);
                        if (availableStartDates.size > 0 && !availableStartDates.has(iso)) return;

                        update("dateNeeded", iso);
                        setIsCalOpen(false);
                      }}
                      onDayMouseEnter={(d, modifiers) => {
                        if (!d) return;
                        if (modifiers.disabled) return;
                        if (isWeekend(d)) return;

                        const iso = dateToISO(d);

                        if (
                          !form.dateNeeded &&
                          !loadingAvailability &&
                          (availableStartDates.size === 0 || availableStartDates.has(iso))
                        ) {
                          setHoverISO(iso);
                        }
                      }}
                      onDayMouseLeave={() => setHoverISO("")}
                      disabled={disabled}
                      fromDate={todayDate}
                      toDate={maxDate}
                      classNames={{
                        months: "w-full text-black",
                        month: "w-full",

                        month_caption: "relative mb-3 h-1",
                        caption_label:
                          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold !text-zinc-900",
                        nav: "flex items-center justify-between h-1",
                        nav_button:
                          "h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-zinc-100 !text-blue-600",
                        nav_button_previous: "-ml-6",
                        nav_button_next: " -mr-6",

                        head_row: "flex w-full",
                        head_cell:
                          "flex-1 text-center text-xs font-bold uppercase !text-zinc-800",

                        row: "flex w-full justify-between mt-2",
                        cell: "h-11 w-11 p-0 flex items-center justify-center",

                        day: `${dayBase} ${hoverBlue}`,
                        day_today: "border border-red-600 !text-red-600",
                        day_disabled: "!text-zinc-300 cursor-not-allowed line-through",
                        day_outside: "!text-zinc-300 opacity-40",

                        day_range_middle:
                          "bg-blue-100 !text-zinc-900 rounded-none first:rounded-l-full last:rounded-r-full",
                        day_range_start:
                          "bg-blue-600 !text-white shadow-md rounded-full hover:bg-blue-700",
                        day_range_end:
                          "bg-blue-600 !text-white shadow-md rounded-full hover:bg-blue-700",
                        day_selected:
                          "bg-blue-600 !text-white shadow-md rounded-full hover:bg-blue-700",
                      }}
                    />
                  )}

                  <div className="mt-3 text-xs text-zinc-700">
                    {loadingAvailability ? (
                      <span>Checking availability…</span>
                    ) : availabilityError ? (
                      <span className="text-red-600">{availabilityError}</span>
                    ) : (
                      <span>
                        Click a start date — we’ll auto-select <b>{durationDays} days</b>. Weekends are not available.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Field>
        </div>

        {/* Duration box */}
        <div className="sm:col-span-2">
          <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <label className="flex items-center gap-3 text-sm text-zinc-900">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={extended}
                onChange={(e) => handleExtendedToggle(e.target.checked)}
              />
              <span className="font-semibold">Need more than 7 days? (+$10 flat fee)</span>
            </label>

            {extended ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-sm text-zinc-700">Select total rental length:</span>
                <select
                  className="w-full sm:w-48 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-600 text-zinc-900"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                >
                  {durationOptions.map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-xs text-zinc-600">Your rental length will be 7 days.</div>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <Field label="Project details (optional)">
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-600 text-zinc-900"
              value={form.details}
              onChange={(e) => update("details", e.target.value)}
              placeholder="What are you throwing away? Any access notes (gate, tight driveway, HOA, etc.)"
            />
          </Field>
        </div>
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


