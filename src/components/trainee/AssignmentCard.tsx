"use client";
import { useState, useEffect } from "react";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  dueDate: Date | null;
};

export function AssignmentCard({ assignment, traineeId }: { assignment: Assignment; traineeId: string }) {
  const [submission, setSubmission] = useState<{ id: string; status: string; feedback: { comment: string | null }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [externalLink, setExternalLink] = useState("");
  useEffect(() => {
    fetch(`/api/assignments/${assignment.id}`)
      .then((r) => r.json())
      .then((data) => {
        const sub = data.submissions?.[0];
        setSubmission(sub || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [assignment.id]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: assignment.id, content: content || undefined, externalLink: externalLink || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmission({ id: data.id, status: data.status, feedback: [] });
        setContent("");
        setExternalLink("");
      }
    } finally {
      setSubmitting(false);
    }
  }
  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-medium text-slate-800">{assignment.title}</h3>
      {assignment.description && <p className="mt-1 text-sm text-slate-600">{assignment.description}</p>}
      {assignment.instructions && <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{assignment.instructions}</p>}
      {assignment.dueDate && <p className="mt-1 text-xs text-slate-500">Due: {new Date(assignment.dueDate).toLocaleString()}</p>}
      {submission ? (
        <div className="mt-4 rounded bg-slate-50 p-3 text-sm">
          <p>Status: <strong>{submission.status}</strong></p>
          {submission.feedback?.[0]?.comment && <p className="mt-2 text-slate-700">Feedback: {submission.feedback[0].comment}</p>}
          {submission.status === "RESUBMIT_REQUESTED" && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-2">
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Resubmit" rows={3} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              <button type="submit" disabled={submitting} className="rounded btn-unipod px-3 py-1.5 text-sm disabled:opacity-50">Resubmit</button>
            </form>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your submission</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">External link (optional)</label>
            <input type="url" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={submitting || (!content && !externalLink)} className="rounded btn-unipod px-4 py-2 text-sm disabled:opacity-50">
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </form>
      )}
    </div>
  );
}
