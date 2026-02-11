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
      : "Please try again.";

  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>

        <p className="mt-4 text-zinc-700">{message}</p>

        {(name || size || range) && (
          <div className="mt-8 rounded-2xl border-2 border-red-600 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Details</h2>

            <ul className="mt-3 space-y-2 text-zinc-700">
              {name && (
                <li>
                  <span className="font-medium text-zinc-900">Customer:</span>{" "}
                  {name}
                </li>
              )}
              {size && (
                <li>
                  <span className="font-medium text-zinc-900">Dumpster:</span>{" "}
                  {size}
                </li>
              )}
              {range && (
                <li>
                  <span className="font-medium text-zinc-900">Dates:</span>{" "}
                  {range}
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="/"
            className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition"
          >
            Back to site
          </a>

          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-900 hover:bg-zinc-100 transition"
          >
            Open Google Calendar
          </a>
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          You can close this tab.
        </p>
      </div>
    </main>
  );
}
