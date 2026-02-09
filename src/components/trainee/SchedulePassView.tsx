"use client";

import Image from "next/image";

type PassEvent = {
  id: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  eventType: string;
  location: string;
  mentorName: string | null;
};

export function SchedulePassView({
  traineeName,
  imageUrl,
  events,
}: {
  traineeName: string;
  imageUrl: string | null;
  events: PassEvent[];
}) {
  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const timeRange = (e: PassEvent) =>
    [e.startTime, e.endTime].filter(Boolean).join(" – ") || "—";
  const typeLabel = (t: string) =>
    t === "MENTOR_MEETING"
      ? "Technical support"
      : t === "COURSE_SCHEDULE"
        ? "Course schedule"
        : "Lab access";

  const handlePrint = () => window.print();

  return (
    <div className="bg-white text-slate-800">
      {/* Screen-only: back link and print button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
        <a
          href="/dashboard/trainee/planning"
          className="text-sm font-medium text-[var(--unipod-blue)] hover:underline"
        >
          ← Back to My Planning
        </a>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-lg bg-[var(--unipod-blue)] text-white px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Print / Download schedule pass
        </button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-slate-200 p-6 text-center">
          <p className="font-medium text-slate-700">No approved schedule yet</p>
          <p className="text-sm text-slate-600 mt-1">
            Your lab, workshop and mentor meeting requests must be approved by an admin before you can download a schedule pass for reception. Request an event from My Planning, then wait for approval.
          </p>
          <a
            href="/dashboard/trainee/planning"
            className="inline-block mt-4 text-sm font-medium text-[var(--unipod-blue)] hover:underline"
          >
            Go to My Planning
          </a>
        </div>
      ) : (
        <div
          id="schedule-pass"
          className="rounded-xl border-2 border-slate-300 p-6 print:border-slate-800 print:shadow-none print:break-inside-avoid"
        >
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-300">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt=""
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-500">
                  {traineeName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Schedule pass</h1>
              <p className="text-slate-600 mt-0.5">For reception</p>
              <p className="font-semibold text-slate-800 mt-2">{traineeName}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Approved visits (admin-approved). Present this pass at reception.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600 font-medium">
                <th className="py-2 pr-2">Date</th>
                <th className="py-2 pr-2">Time</th>
                <th className="py-2 pr-2">Type</th>
                <th className="py-2 pr-2">Location</th>
                <th className="py-2">Mentor</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 whitespace-nowrap">{formatDate(ev.date)}</td>
                  <td className="py-2 pr-2">{timeRange(ev)}</td>
                  <td className="py-2 pr-2">{typeLabel(ev.eventType)}</td>
                  <td className="py-2 pr-2">{ev.location}</td>
                  <td className="py-2">{ev.mentorName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
