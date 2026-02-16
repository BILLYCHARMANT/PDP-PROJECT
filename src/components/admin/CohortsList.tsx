"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreateCohortModal } from "@/components/admin/CreateCohortModal";

type Program = { id: string; name: string };
type Course = { id: string; name: string; programId: string | null };
type Mentor = { id: string; name: string; email: string };

type Cohort = {
  id: string;
  name: string;
  createdAt?: string;
  programId: string | null;
  program: { id: string; name: string } | null;
  mentor: { id: string; name: string } | null;
  _count?: { enrollments: number };
};

export function CohortsList({
  programs = [],
  allCourses = [],
  mentors = [],
}: {
  programs?: Program[];
  allCourses?: Course[];
  mentors?: Mentor[];
} = {}) {
  const router = useRouter();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  function loadCohorts() {
    fetch("/api/cohorts")
      .then((r) => r.json())
      .then((data) => {
        setCohorts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadCohorts();
  }, []);

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `Delete cohort "${name}"? This will also remove all trainee enrollments in this cohort. This action cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/cohorts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete cohort");
        setDeletingId(null);
        return;
      }
      loadCohorts();
      router.refresh();
    } catch {
      alert("Network error");
      setDeletingId(null);
    }
  }

  const uniquePrograms = Array.from(
    new Map(cohorts.filter((c) => c.program).map((c) => [c.program!.id, c.program!])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
  const uniqueMentors = Array.from(
    new Map(cohorts.filter((c) => c.mentor).map((c) => [c.mentor!.id, c.mentor!])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filtered = cohorts.filter((c) => {
    const s = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !s ||
      c.name.toLowerCase().includes(s) ||
      (c.program?.name ?? "").toLowerCase().includes(s) ||
      (c.mentor?.name ?? "").toLowerCase().includes(s);
    if (!matchesSearch) return false;
    if (!filterValue) return true;
    if (filterValue.startsWith("program:")) {
      const id = filterValue.slice("program:".length);
      return c.programId === id;
    }
    if (filterValue.startsWith("mentor:")) {
      const id = filterValue.slice("mentor:".length);
      return c.mentor?.id === id;
    }
    return true;
  });

  function formatDate(date: string | undefined) {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center text-[#6b7280]">
        Loading…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden">
      {/* Tabs + Action bar - Hope LMS style */}
      <div className="border-b border-[#e5e7eb] bg-[#fafafa] px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-[#171717] shadow-sm border border-[#e5e7eb]"
            >
              All <span className="ml-1.5 text-[#9ca3af]">({cohorts.length})</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter cohorts"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="rounded-lg border border-[#e5e7eb] bg-white pl-3 pr-8 py-2 text-sm text-[#374151] min-w-[160px]"
            >
              <option value="">All cohorts</option>
              {uniquePrograms.length > 0 && (
                <>
                  <option disabled>— By program —</option>
                  {uniquePrograms.map((p) => (
                    <option key={p.id} value={`program:${p.id}`}>
                      Program: {p.name}
                    </option>
                  ))}
                </>
              )}
              {uniqueMentors.length > 0 && (
                <>
                  <option disabled>— By mentor —</option>
                  {uniqueMentors.map((m) => (
                    <option key={m.id} value={`mentor:${m.id}`}>
                      Mentor: {m.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            <div className="relative">
              <input
                type="text"
                placeholder="Search cohorts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 rounded-lg border border-[#e5e7eb] bg-white pl-9 pr-3 py-2 text-sm placeholder:text-[#9ca3af]"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="flex rounded-lg border border-[#e5e7eb] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-[#f3f4f6] text-[#171717]" : "text-[#6b7280] hover:bg-[#f9fafb]"}`}
                title="List view"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-[#f3f4f6] text-[#171717]" : "text-[#6b7280] hover:bg-[#f9fafb]"}`}
                title="Grid view"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--unipod-blue, #2563eb)" }}
            >
              <span className="text-lg leading-none">+</span>
              New
            </button>
          </div>
        </div>
      </div>

      {/* List header - column titles like Hope LMS */}
      {filtered.length > 0 && viewMode === "list" && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[minmax(200px,1fr)_minmax(140px,1fr)_120px_100px_140px] gap-4 px-6 py-3 border-b border-[#e5e7eb] bg-[#f9fafb] text-xs font-semibold uppercase tracking-wider text-[#6b7280] min-w-[700px]">
            <div>Cohort</div>
            <div>Course</div>
            <div>Mentor</div>
            <div>Trainees</div>
            <div>Actions</div>
          </div>
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <>
          <div className="p-12 text-center text-[#6b7280]">
            {cohorts.length === 0
              ? "No cohorts yet. Create one to get started."
              : "No cohorts match your search."}
            {cohorts.length === 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--unipod-blue, #2563eb)" }}
                >
                  <span className="text-lg leading-none">+</span>
                  New cohort
                </button>
              </div>
            )}
          </div>
        </>
      ) : viewMode === "grid" ? (
        <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CohortCard
              key={c.id}
              cohort={c}
              formatDate={formatDate}
              onDelete={handleDelete}
              deletingId={deletingId}
              onCardClick={() => router.push(`/dashboard/admin/cohorts/${c.id}`)}
            />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-[#e5e7eb] overflow-x-auto">
          {filtered.map((c) => (
            <li
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/dashboard/admin/cohorts/${c.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/dashboard/admin/cohorts/${c.id}`);
                }
              }}
              className="hover:bg-[#fafafa] transition-colors min-w-[700px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--unipod-blue,#2563eb)]"
            >
              <div className="grid grid-cols-[minmax(200px,1fr)_minmax(140px,1fr)_120px_100px_140px] gap-4 items-center px-6 py-4">
                {/* Cohort: thumbnail + name + created */}
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white"
                    style={{ backgroundColor: "var(--unipod-blue, #2563eb)" }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span
                      className="font-semibold text-[#171717] block truncate"
                      style={{ color: "var(--unipod-blue)" }}
                    >
                      {c.name}
                    </span>
                    <p className="text-xs text-[#6b7280] mt-0.5">
                      Created: {formatDate((c as { createdAt?: string }).createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-[#374151] truncate">
                  {c.program ? c.program.name : "—"}
                </div>
                <div className="text-sm text-[#374151] truncate">
                  {c.mentor ? c.mentor.name : "—"}
                </div>
                <div className="text-sm text-[#374151]">
                  {c._count?.enrollments ?? 0} trainee{(c._count?.enrollments ?? 0) !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/dashboard/admin/cohorts/${c.id}`}
                    className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.name)}
                    disabled={deletingId === c.id}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === c.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {createModalOpen && (
        <CreateCohortModal
          programs={programs}
          allCourses={allCourses}
          mentors={mentors}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            loadCohorts();
            setCreateModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CohortCard({
  cohort: c,
  formatDate,
  onDelete,
  deletingId,
  onCardClick,
}: {
  cohort: Cohort;
  formatDate: (date: string | undefined) => string;
  onDelete: (id: string, name: string) => void;
  deletingId: string | null;
  onCardClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCardClick();
        }
      }}
      className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm hover:shadow transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--unipod-blue,#2563eb)]"
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white mb-3"
        style={{ backgroundColor: "var(--unipod-blue, #2563eb)" }}
      >
        {c.name.charAt(0).toUpperCase()}
      </div>
      <span
        className="font-semibold text-[#171717] block"
        style={{ color: "var(--unipod-blue)" }}
      >
        {c.name}
      </span>
      <p className="text-xs text-[#6b7280] mt-1">
        Created: {formatDate((c as { createdAt?: string }).createdAt)}
      </p>
      <p className="text-sm text-[#374151] mt-2">
        {c.program ? c.program.name : "No course"}
        {c.mentor && ` · ${c.mentor.name}`}
      </p>
      <p className="text-xs text-[#6b7280] mt-1">
        {c._count?.enrollments ?? 0} trainee{(c._count?.enrollments ?? 0) !== 1 ? "s" : ""}
      </p>
      <div
        className="flex items-center gap-2 mt-4 pt-3 border-t border-[#e5e7eb]"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={`/dashboard/admin/cohorts/${c.id}`}
          className="flex-1 text-center rounded-lg border border-[#e5e7eb] bg-white py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => onDelete(c.id, c.name)}
          disabled={deletingId === c.id}
          className="flex-1 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deletingId === c.id ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
