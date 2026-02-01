export default async function ApprovePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; name?: string; size?: string; range?: string }>;
}) {
  const { status, name, size, range } = await searchParams;

  const title =
    status === "approved"
      ? "✅ Approved"
      : status === "declined"
      ? "❌ Declined"
      : status === "invalid"
      ? "⚠️ Link Invalid or Expired"
      : "⚠️ Something went wrong";

  const message =
    status === "approved"
      ? "The booking has been confirmed and the customer was notified."
      : status === "declined"
      ? "The booking request was declined and the customer was notified."
      : status === "invalid"
      ? "This link is invalid or has expired. Please request a new link."
      : "Please try again, or contact support if the issue persists.";

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-slate-700">{message}</p>

      {(name || size || range) && (
        <div className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Details</h2>
          <ul className="mt-3 space-y-2 text-slate-700">
            {name && (
              <li>
                <span className="font-medium">Customer:</span> {name}
              </li>
            )}
            {size && (
              <li>
                <span className="font-medium">Dumpster:</span> {size}
              </li>
            )}
            {range && (
              <li>
                <span className="font-medium">Dates:</span> {range}
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-10 flex gap-3">
        <a
          href="/"
          className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white"
        >
          Back to site
        </a>
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-md border px-4 py-2"
        >
          Open Google Calendar
        </a>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        You can close this tab.
      </p>
    </main>
  );
}
