"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const LOCATIONS = [
  "Green tech lab",
  "Design lab",
  "Rapid prototyping lab",
  "Textile lab",
  "VR and Gaming lab",
  "Electrical and Electronics lab",
  "Food and agri-tech lab",
  "Music and studio lab",
  "Wood workshop lab",
  "Metal workshop lab",
  "Pitching area",
  "Cafeteria",
] as const;

type EventType = "LAB_WORKSHOP" | "MENTOR_MEETING" | "COURSE_SCHEDULE";

type Program = { id: string; name: string };
type ModuleWithLessons = { id: string; title: string; programId: string; lessons: { id: string; title: string; order: number }[] };

type Props = {
  defaultDate: string; // YYYY-MM-DD
  userName?: string;
  cohortName?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ScheduleEventFormModal({ defaultDate, userName: initialUserName, cohortName: initialCohortName, onClose, onSuccess }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traineeName, setTraineeName] = useState(initialUserName ?? "");
  const [cohortName, setCohortName] = useState(initialCohortName ?? "—");
  const [mentors, setMentors] = useState<{ id: string; name: string }[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);

  // Resolve logged-in trainee, cohort, mentors, programs, modules for the form
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/trainee/planning-context");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && data.traineeName != null) setTraineeName(data.traineeName);
        if (!cancelled && data.cohortName != null) setCohortName(data.cohortName);
        if (!cancelled && Array.isArray(data.mentors)) setMentors(data.mentors);
        if (!cancelled && Array.isArray(data.programs)) setPrograms(data.programs);
        if (!cancelled && Array.isArray(data.modules)) setModules(data.modules);
      } catch {
        if (!cancelled) {
          setTraineeName(initialUserName ?? "");
          setCohortName(initialCohortName ?? "—");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [initialUserName, initialCohortName]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [eventType, setEventType] = useState<EventType>("LAB_WORKSHOP");
  const [date, setDate] = useState(() => (defaultDate >= todayStr ? defaultDate : todayStr));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]>(LOCATIONS[0]);
  const [teamMembers, setTeamMembers] = useState("");
  const [equipmentNeeded, setEquipmentNeeded] = useState("");
  const [description, setDescription] = useState("");
  const [requestCoffee, setRequestCoffee] = useState(false);
  const [mentorId, setMentorId] = useState("");
  const [programId, setProgramId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [lessonId, setLessonId] = useState("");

  const modulesForProgram = useMemo(
    () => (programId ? modules.filter((m) => m.programId === programId) : []),
    [programId, modules]
  );
  const lessonsForModule = useMemo(
    () => (moduleId ? modules.find((m) => m.id === moduleId)?.lessons ?? [] : []),
    [moduleId, modules]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/trainee/schedule-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          startTime: startTime || null,
          endTime: endTime || null,
          eventType,
          requestCoffee,
          mentorId: eventType === "MENTOR_MEETING" ? mentorId || null : null,
          location,
          equipmentNeeded: equipmentNeeded || null,
          teamMembers: teamMembers.trim() || null,
          description: description.trim() || null,
          ...(eventType === "COURSE_SCHEDULE" ? { moduleId, lessonId } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create schedule");
      }
      onSuccess();
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#171717]">Schedule lab, workshop or mentor meeting</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#171717]"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Trainee (logged in)</label>
              <input
                type="text"
                value={traineeName}
                readOnly
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-sm text-[#6b7280]"
                placeholder="Loading…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Your cohort (assigned)</label>
              <input
                type="text"
                value={cohortName}
                readOnly
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-sm text-[#6b7280]"
                placeholder="Loading…"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Date</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-2">Schedule type</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="eventType"
                  checked={eventType === "LAB_WORKSHOP"}
                  onChange={() => setEventType("LAB_WORKSHOP")}
                  className="rounded-full border-[#d1d5db] text-orange-600"
                />
                <span className="text-sm">Lab access</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="eventType"
                  checked={eventType === "COURSE_SCHEDULE"}
                  onChange={() => setEventType("COURSE_SCHEDULE")}
                  className="rounded-full border-[#d1d5db] text-orange-600"
                />
                <span className="text-sm">Course schedule (delivered by mentor)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="eventType"
                  checked={eventType === "MENTOR_MEETING"}
                  onChange={() => setEventType("MENTOR_MEETING")}
                  className="rounded-full border-[#d1d5db] text-orange-600"
                />
                <span className="text-sm">Technical support (meet with mentor)</span>
              </label>
            </div>
          </div>

          {eventType === "COURSE_SCHEDULE" && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Course *</label>
                <select
                  value={programId}
                  onChange={(e) => {
                    setProgramId(e.target.value);
                    setModuleId("");
                    setLessonId("");
                  }}
                  required
                  className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
                >
                  <option value="">Select course</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {programs.length === 0 && (
                  <p className="text-xs text-[#6b7280] mt-1">No course available. You must be enrolled in a program.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Module *</label>
                <select
                  value={moduleId}
                  onChange={(e) => {
                    setModuleId(e.target.value);
                    setLessonId("");
                  }}
                  required
                  disabled={!programId}
                  className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
                >
                  <option value="">Select module</option>
                  {modulesForProgram.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Chapter to attend *</label>
                <select
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  required
                  disabled={!moduleId}
                  className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
                >
                  <option value="">Select chapter</option>
                  {lessonsForModule.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {eventType === "MENTOR_MEETING" && (
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Mentor (assigned to your cohort) *</label>
              <select
                value={mentorId}
                onChange={(e) => setMentorId(e.target.value)}
                required
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
              >
                <option value="">Select mentor</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {mentors.length === 0 && (
                <p className="text-xs text-[#6b7280] mt-1">No mentor assigned to your cohort yet.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Estimated leave time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as typeof LOCATIONS[number])}
              required
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Team members / visitors (names)</label>
            <input
              type="text"
              value={teamMembers}
              onChange={(e) => setTeamMembers(e.target.value)}
              placeholder="e.g. John, Jane"
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Equipment needed</label>
            <input
              type="text"
              value={equipmentNeeded}
              onChange={(e) => setEquipmentNeeded(e.target.value)}
              placeholder="List any equipment you need"
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requestCoffee}
                onChange={(e) => setRequestCoffee(e.target.checked)}
                className="rounded border-[#d1d5db] text-orange-600"
              />
              <span className="text-sm">Request coffee</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">What you&apos;ll be doing (short description)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your activity"
              rows={3}
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                (eventType === "MENTOR_MEETING" && (!mentorId || mentors.length === 0)) ||
                (eventType === "COURSE_SCHEDULE" && (!programId || !moduleId || !lessonId))
              }
              className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
