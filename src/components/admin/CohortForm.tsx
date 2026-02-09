"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Program = { id: string; name: string };
type Mentor = { id: string; name: string; email: string };

export function CohortForm({
  programs,
  mentors,
  initial = {},
  cohortId,
  onSuccess,
}: {
  programs: Program[];
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
  const [programId, setProgramId] = useState(initial.programId ?? "");
  const [mentorId, setMentorId] = useState(initial.mentorId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      onSuccess?.();
      router.push(cohortId ? `/dashboard/admin/cohorts/${cohortId}` : "/dashboard/admin/cohorts");
      router.refresh();
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
          Course <span className="text-xs font-normal text-slate-500">(optional - assign later when creating course)</span>
        </label>
        <select
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">No course (assign later)</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
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
