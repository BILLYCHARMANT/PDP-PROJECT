"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function FeedbackForm({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [passed, setPassed] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"APPROVED" | "REJECTED" | "RESUBMIT_REQUESTED">("APPROVED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          comment: comment || undefined,
          passed: passed ?? undefined,
          status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed");
        setLoading(false);
        return;
      }
      router.refresh();
      router.push("/dashboard/mentor/submissions");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm space-y-4">
      <h2 className="font-semibold text-[#171717]">Add feedback</h2>
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-1">
          Comment
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-[#171717]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-1">
          Pass / Fail
        </label>
        <select
          value={passed === null ? "" : passed ? "pass" : "fail"}
          onChange={(e) =>
            setPassed(
              e.target.value === ""
                ? null
                : e.target.value === "pass"
            )
          }
          className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-[#171717]"
        >
          <option value="">—</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-1">
          Decision
        </label>
        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value as
                | "APPROVED"
                | "REJECTED"
                | "RESUBMIT_REQUESTED"
            )
          }
          className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-[#171717]"
        >
          <option value="APPROVED">Approve</option>
          <option value="REJECTED">Reject</option>
          <option value="RESUBMIT_REQUESTED">Request resubmission</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--unipod-blue)" }}
      >
        {loading ? "Submitting…" : "Submit feedback"}
      </button>
    </form>
  );
}
