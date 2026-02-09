"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssignmentForm({
  moduleId,
  programId,
  initial = {},
  assignmentId,
}: {
  moduleId: string;
  programId: string;
  initial?: {
    title?: string;
    description?: string;
    instructions?: string;
    dueDate?: string | null;
    order?: number;
  };
  assignmentId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [instructions, setInstructions] = useState(initial.instructions ?? "");
  const [dueDate, setDueDate] = useState(
    initial.dueDate ? initial.dueDate.slice(0, 16) : ""
  );
  const [order, setOrder] = useState(initial.order ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = assignmentId
        ? `/api/assignments/${assignmentId}`
        : "/api/assignments";
      const method = assignmentId ? "PATCH" : "POST";
      const body = assignmentId
        ? { title, description, instructions, dueDate: dueDate ? new Date(dueDate).toISOString() : null, order }
        : {
            moduleId,
            title,
            description,
            instructions,
            dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            order,
          };
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
      router.push(`/dashboard/admin/programs/${programId}/modules/${moduleId}`);
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Due date & time (assignment schedule)
        </label>
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          aria-description="Assignments have their own schedule; set when this assignment is due."
        />
        <p className="text-xs text-slate-500 mt-1">
          Assignments have their own schedule (date and time), separate from the module schedule.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
        <input
          type="number"
          min={0}
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg btn-unipod px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Saving…" : assignmentId ? "Update" : "Create"}
      </button>
    </form>
  );
}
