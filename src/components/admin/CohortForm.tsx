"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Program = { id: string; name: string };
type Course = { id: string; name: string; programId: string | null };
type Mentor = { id: string; name: string; email: string };

export function CohortForm({
  programs,
  allCourses,
  mentors,
  initial = {},
  cohortId,
  onSuccess,
}: {
  programs: Program[];
  allCourses?: Course[];
  mentors: Mentor[];
  initial?: {
    name?: string;
    programId?: string;
    mentorId?: string | null;
  };
  cohortId?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name ?? "");
  const [selectedProgramId, setSelectedProgramId] = useState(initial.programId ?? "");
  const [programId, setProgramId] = useState(initial.programId ?? ""); // This will be set when course is selected
  const [courseId, setCourseId] = useState("");
  const [mentorId, setMentorId] = useState(initial.mentorId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);

  // Filter courses by selected program: show courses in this program + unassigned courses (so created courses appear)
  useEffect(() => {
    if (selectedProgramId && allCourses) {
      const filtered = allCourses.filter(
        (c) => c.programId === selectedProgramId || c.programId == null
      );
      setCourses(filtered);
      setCourseId("");
      setProgramId(selectedProgramId);
    } else {
      setCourses([]);
      setCourseId("");
      setProgramId("");
    }
  }, [selectedProgramId, allCourses]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = cohortId
        ? `/api/cohorts/${cohortId}`
        : "/api/cohorts";
      const method = cohortId ? "PATCH" : "POST";
      const body = cohortId
        ? { 
            name: name || undefined, 
            programId: programId || null, // Allow changing course assignment when editing
            mentorId: mentorId || null 
          }
        : { name, programId: programId || undefined, mentorId: mentorId || undefined };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(JSON.stringify(data.error) || "Failed");
        setLoading(false);
        return;
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(cohortId ? `/dashboard/admin/cohorts/${cohortId}` : "/dashboard/admin/cohorts");
        router.refresh();
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Program <span className="text-xs font-normal text-slate-500">(optional - assign later)</span>
        </label>
        <select
          value={selectedProgramId}
          onChange={(e) => setSelectedProgramId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">No program (assign later)</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      {selectedProgramId && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Course <span className="text-xs font-normal text-slate-500">(optional - view courses assigned to this program)</span>
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">No course selected (cohort will be assigned to program)</option>
            {courses.length === 0 ? (
              <option value="" disabled>No courses available for this program</option>
            ) : (
              courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
          {courses.length === 0 && selectedProgramId && (
            <p className="text-xs text-slate-500 mt-1">
              No courses assigned to this program yet. You can assign courses to this program from the program management page.
            </p>
          )}
          {courseId && (
            <p className="text-xs text-blue-600 mt-1">
              Note: The cohort will be assigned to the program. Course selection is for reference only.
            </p>
          )}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Mentor
        </label>
        <select
          value={mentorId}
          onChange={(e) => setMentorId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">None</option>
          {mentors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.email})
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg btn-unipod px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Saving…" : cohortId ? "Update" : "Create"}
      </button>
    </form>
  );
}
