"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STEPS = [
  { num: 1, label: "Course Details" },
  { num: 2, label: "Curriculum" },
  { num: 3, label: "FAQ" },
];

type FaqItem = { question: string; answer: string };

export function CreateCourseWizard({
  initialStep,
  initialProgramId,
  userRole,
}: {
  initialStep: number;
  initialProgramId: string | null;
  userRole: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [programId, setProgramId] = useState<string | null>(initialProgramId);
  const [programName, setProgramName] = useState<string>("");

  // Step 1 form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [skillOutcomes, setSkillOutcomes] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const courseImageInputRef = useRef<HTMLInputElement>(null);

  // Step 3 FAQ
  const [faqList, setFaqList] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqError, setFaqError] = useState("");

  const programsBase = userRole === "ADMIN" ? "/dashboard/admin/programs" : "/dashboard/mentor/programs";

  useEffect(() => {
    setStep(initialStep);
    setProgramId(initialProgramId);
  }, [initialStep, initialProgramId]);

  useEffect(() => {
    if (programId && (step === 2 || step === 3)) {
      fetch(`/api/programs/${programId}`)
        .then((r) => r.json())
        .then((p) => {
          if (p?.name) setProgramName(p.name);
          if (step === 3 && Array.isArray(p?.faq)) setFaqList(p.faq);
        })
        .catch(() => {});
    }
  }, [programId, step]);

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          duration: duration.trim() || undefined,
          skillOutcomes: skillOutcomes.trim() || undefined,
          cohortIds: selectedCohortIds.length > 0 ? selectedCohortIds : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message || data.error || "Failed to create course");
        setLoading(false);
        return;
      }
      setProgramId(data.id);
      setProgramName(data.name);
      router.push(`/dashboard/courses/new?step=2&programId=${data.id}`);
      setStep(2);
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  function goToStep3() {
    if (programId) {
      router.push(`/dashboard/courses/new?step=3&programId=${programId}`);
      setStep(3);
    }
  }

  function addFaq() {
    setFaqList((prev) => [...prev, { question: "", answer: "" }]);
  }

  function removeFaq(i: number) {
    setFaqList((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateFaq(i: number, field: "question" | "answer", value: string) {
    setFaqList((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }

  async function saveDraft() {
    if (!programId) return;
    setFaqError("");
    setFaqLoading(true);
    try {
      const res = await fetch(`/api/programs/${programId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faq: faqList.filter((f) => f.question.trim()) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFaqError(d.error || "Failed to save");
        setFaqLoading(false);
        return;
      }
      router.push(programsBase);
      router.refresh();
    } catch {
      setFaqError("Network error");
    }
    setFaqLoading(false);
  }

  async function publish() {
    if (!programId) return;
    setFaqError("");
    setFaqLoading(true);
    try {
      const res = await fetch(`/api/programs/${programId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faq: faqList.filter((f) => f.question.trim()) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFaqError(d.error || "Failed to save");
        setFaqLoading(false);
        return;
      }
      if (userRole === "ADMIN") {
        const activateRes = await fetch(`/api/admin/programs/${programId}/activate`, { method: "POST" });
        if (activateRes.ok) { /* program activated if has cohort */ }
      }
      router.push(programsBase);
      router.refresh();
    } catch {
      setFaqError("Network error");
    }
    setFaqLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={programsBase}
          className="text-sm font-medium text-[#6b7280] dark:text-[#9ca3af] hover:text-[#171717] dark:hover:text-[#f9fafb]"
        >
          ← Course List
        </Link>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Create New Course</h1>
        <p className="mt-1 text-[#6b7280] dark:text-[#9ca3af]">
          Flow: Trainees in a cohort access this <strong>course</strong> → course has <strong>modules</strong> → modules have <strong>chapters</strong> (and assignments). Complete each step below.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                step === s.num
                  ? "bg-[var(--unipod-blue)] text-white"
                  : "bg-[#e5e7eb] dark:bg-[#374151] text-[#6b7280] dark:text-[#9ca3af]"
              }`}
            >
              {s.num}
            </div>
            <span className={`text-sm font-medium ${step === s.num ? "text-[#171717] dark:text-[#f9fafb]" : "text-[#6b7280] dark:text-[#9ca3af]"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-0.5 w-6 bg-[#e5e7eb] dark:bg-[#374151]" aria-hidden />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Course Details */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Course title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
              placeholder="e.g. Introduction to PDP"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
              placeholder="What this course covers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Course image (optional)</label>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt=""
                    width={160}
                    height={100}
                    className="rounded-lg object-cover border border-[#e5e7eb] dark:border-[#374151] w-40 h-[100px]"
                  />
                ) : (
                  <div className="w-40 h-[100px] rounded-lg border-2 border-dashed border-[#e5e7eb] dark:border-[#374151] bg-[var(--sidebar-bg)] dark:bg-[#1f2937] flex items-center justify-center text-[#6b7280] dark:text-[#9ca3af] text-sm">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <input
                  ref={courseImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !file.type.startsWith("image/")) {
                      setError("Please select an image (PNG, JPG, GIF, WebP).");
                      return;
                    }
                    setError("");
                    setUploading(true);
                    const formData = new FormData();
                    formData.set("file", file);
                    formData.set("type", "course");
                    try {
                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                      const data = await res.json().catch(() => ({}));
                      if (data?.fileUrl) setImageUrl(data.fileUrl);
                      else setError("Upload failed.");
                    } catch {
                      setError("Upload failed.");
                    }
                    setUploading(false);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => courseImageInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-3 py-2 text-sm font-medium text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151] disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : imageUrl ? "Change image" : "Upload image"}
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-[#6b7280] dark:text-[#9ca3af] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]"
                  >
                    Remove
                  </button>
                )}
                <p className="mt-1 text-xs text-[#6b7280] dark:text-[#9ca3af]">PNG, JPG, GIF or WebP. Used on course cards.</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Duration (optional)</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
              placeholder="e.g. 12 weeks"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">What students will learn (optional)</label>
            <textarea
              value={skillOutcomes}
              onChange={(e) => setSkillOutcomes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
              placeholder="One outcome per line or short paragraph"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Link
              href={programsBase}
              className="rounded-lg px-4 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              {loading ? "Creating…" : "Save & Continue →"}
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Curriculum */}
      {step === 2 && programId && (
        <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-6 shadow-sm space-y-4">
          <p className="text-[#374151] dark:text-[#d1d5db]">
            Add <strong>modules</strong> to this course; inside each module add <strong>chapters</strong> and <strong>assignments</strong>. Trainees in this course’s cohort(s) will see them.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/admin/programs/${programId}`}
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              Open curriculum →
            </Link>
            <span className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
              Add modules, chapters, and assignments there
            </span>
          </div>
          <div className="flex gap-3 pt-4">
            <Link
              href={programsBase}
              className="rounded-lg px-4 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db]"
            >
              Save as Draft
            </Link>
            <button
              type="button"
              onClick={goToStep3}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              Save & Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: FAQ */}
      {step === 3 && programId && (
        <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">Frequently Asked Questions</h2>
            <button
              type="button"
              onClick={addFaq}
              className="rounded-lg px-3 py-1.5 text-sm font-medium border border-[var(--unipod-blue)] text-[var(--unipod-blue)] hover:bg-[var(--unipod-blue-light)]"
            >
              + Add FAQ
            </button>
          </div>
          <div className="space-y-4">
            {faqList.length === 0 && (
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">No FAQs yet. Click &quot;+ Add FAQ&quot; to add one.</p>
            )}
            {faqList.map((item, i) => (
              <div key={i} className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) => updateFaq(i, "question", e.target.value)}
                    placeholder="Question"
                    className="flex-1 rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
                  />
                  <button
                    type="button"
                    onClick={() => removeFaq(i)}
                    className="p-2 text-[#6b7280] hover:text-red-600 rounded"
                    aria-label="Remove FAQ"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <textarea
                  value={item.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                  placeholder="Answer"
                  rows={2}
                  className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
                />
              </div>
            ))}
          </div>
          {faqError && <p className="text-sm text-red-600 dark:text-red-400">{faqError}</p>}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={saveDraft}
              disabled={faqLoading}
              className="rounded-lg px-4 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db] disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={faqLoading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              Publish →
            </button>
          </div>
        </div>
      )}

      {step === 2 && !programId && (
        <p className="text-[#6b7280]">Missing course. Start from <Link href="/dashboard/courses/new" className="underline" style={{ color: "var(--unipod-blue)" }}>step 1</Link>.</p>
      )}
    </div>
  );
}
