"use client";
import { useState, useEffect, useRef } from "react";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  dueDate: Date | null;
};

const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx";

type SubmissionFeedback = {
  id: string;
  comment: string | null;
  grade: string | null;
  adminComment: string | null;
  adminApprovedAt: Date | null;
};

export function AssignmentCard({ assignment, traineeId }: { assignment: Assignment; traineeId: string }) {
  const [submission, setSubmission] = useState<{ id: string; status: string; feedback: SubmissionFeedback[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [content, setContent] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (![".pdf", ".doc", ".docx"].some((e) => file.name.toLowerCase().endsWith(e))) {
      setUploadError("Please choose a PDF or Word document (.pdf, .doc, .docx).");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "submission");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        return;
      }
      setFileUrl(data.fileUrl ?? null);
      setFileName(data.filename ?? file.name);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeFile() {
    setFileUrl(null);
    setFileName(null);
    setUploadError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        content: content.trim() || undefined,
        externalLink: externalLink.trim() || undefined,
        fileUrl: fileUrl || undefined,
      };
      if (isResubmit && submission?.id) {
        const res = await fetch(`/api/submissions/${submission.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setSubmission({ id: data.id, status: data.status, feedback: submission.feedback });
          setContent("");
          setExternalLink("");
          setFileUrl(null);
          setFileName(null);
          // Refresh submission data to get updated status
          fetch(`/api/assignments/${assignment.id}`)
            .then((r) => r.json())
            .then((data) => {
              const sub = data.submissions?.[0];
              if (sub) setSubmission(sub);
            })
            .catch(() => {});
        }
      } else {
        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignmentId: assignment.id, ...payload }),
        });
        if (res.ok) {
          const data = await res.json();
          setSubmission({ id: data.id, status: data.status, feedback: [] });
          setContent("");
          setExternalLink("");
          setFileUrl(null);
          setFileName(null);
          // Refresh submission data to get complete info
          fetch(`/api/assignments/${assignment.id}`)
            .then((r) => r.json())
            .then((data) => {
              const sub = data.submissions?.[0];
              if (sub) setSubmission(sub);
            })
            .catch(() => {});
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  const hasContent = content.trim() || externalLink.trim() || fileUrl;
  const isResubmit = submission?.status === "RESUBMIT_REQUESTED";

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-[#374151] bg-white dark:bg-[#1f2937] p-4">
      <h3 className="font-medium text-slate-800 dark:text-[#f9fafb]">{assignment.title}</h3>
      {assignment.description && <p className="mt-1 text-sm text-slate-600 dark:text-[#9ca3af]">{assignment.description}</p>}
      {assignment.instructions && <p className="mt-2 text-sm text-slate-700 dark:text-[#d1d5db] whitespace-pre-wrap">{assignment.instructions}</p>}
      <p className="mt-1 text-xs text-slate-500 dark:text-[#9ca3af]">
        Submission format: Text / Word / PDF / Form response
      </p>
      {assignment.dueDate && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-[#9ca3af]">
          Due: {new Date(assignment.dueDate).toLocaleString()}
        </p>
      )}
      {submission && !isResubmit ? (
        <div className="mt-4 rounded bg-slate-50 dark:bg-[#111827] p-3 text-sm">
          <p>Status: <strong>{submission.status}</strong></p>
          {submission.feedback?.[0]?.comment && <p className="mt-2 text-slate-700 dark:text-[#d1d5db]">Feedback: {submission.feedback[0].comment}</p>}
        </div>
      ) : (
        <>
          {isResubmit && submission && (
            <div className="mt-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                Resubmission requested
              </p>
              {submission.feedback && submission.feedback.length > 0 && (
                <div className="mt-2 space-y-2">
                  {submission.feedback.map((f: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-[#1f2937] rounded p-3 border border-orange-200 dark:border-orange-800">
                      {f.grade && (
                        <p className="text-sm font-semibold text-slate-800 dark:text-[#f9fafb] mb-1">
                          Grade: {f.grade}
                        </p>
                      )}
                      {f.comment && (
                        <div>
                          <p className="text-xs font-medium text-slate-600 dark:text-[#9ca3af] mb-1">Feedback:</p>
                          <p className="text-sm text-slate-700 dark:text-[#d1d5db] whitespace-pre-wrap">{f.comment}</p>
                        </div>
                      )}
                      {f.adminComment && (
                        <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800">
                          <p className="text-xs font-medium text-slate-600 dark:text-[#9ca3af] mb-1">Admin note:</p>
                          <p className="text-sm text-slate-700 dark:text-[#d1d5db] whitespace-pre-wrap">{f.adminComment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-3">
                Please review the feedback above and submit an updated version.
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-[#d1d5db] mb-1">Your submission</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your response or paste text here..."
              rows={4}
              className="w-full rounded border border-slate-300 dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-slate-800 dark:text-[#f9fafb] placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-[#d1d5db] mb-1">
              Upload document (optional)
            </label>
            <p className="text-xs text-slate-500 dark:text-[#9ca3af] mb-1">PDF or Word (.pdf, .doc, .docx)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-slate-600 dark:text-[#9ca3af] file:mr-3 file:rounded file:border-0 file:bg-[var(--unipod-blue)] file:px-3 file:py-1.5 file:text-sm file:text-white file:cursor-pointer"
            />
            {uploading && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
            {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
            {fileName && fileUrl && (
              <p className="mt-1 text-xs text-slate-600 dark:text-[#9ca3af]">
                <span className="font-medium">{fileName}</span>
                <button type="button" onClick={removeFile} className="ml-2 text-red-600 hover:underline">
                  Remove
                </button>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-[#d1d5db] mb-1">External link (optional)</label>
            <input
              type="url"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="e.g. Google Drive, OneDrive link"
              className="w-full rounded border border-slate-300 dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-slate-800 dark:text-[#f9fafb] placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !hasContent}
            className="rounded btn-unipod px-4 py-2 text-sm disabled:opacity-50"
          >
            {submitting ? "Submitting…" : isResubmit ? "Resubmit" : "Submit"}
          </button>
        </form>
        </>
      )}
    </div>
  );
}
