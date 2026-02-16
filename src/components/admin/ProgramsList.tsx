"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreateCourseModal } from "@/components/admin/CreateCourseModal";

type Program = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  duration: string | null;
  status: string;
  cohorts: { id: string; name: string; startDate: string | null }[];
  courses: { id: string; name: string; modules: { id: string; title: string; order: number }[] }[];
};

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=220&fit=crop";

function formatStartDate(cohorts: Program["cohorts"]): string | null {
  const withDate = cohorts.filter((c) => c.startDate);
  if (withDate.length === 0) return null;
  const sorted = [...withDate].sort(
    (a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime()
  );
  return new Date(sorted[0].startDate!).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ProgramsList({ showCreateAction = true }: { showCreateAction?: boolean }) {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  function loadPrograms() {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((data) => {
        setPrograms(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }
  
  useEffect(() => {
    loadPrograms();
    // Fetch user role for modal
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.role) {
          setUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);
  
  async function handleDelete(id: string, name: string, cohortCount: number, moduleCount: number) {
    const message = cohortCount > 0 || moduleCount > 0
      ? `Delete course "${name}"? This will also delete ${cohortCount} cohort(s) and ${moduleCount} module(s) (including all chapters and assignments). This action cannot be undone.`
      : `Delete course "${name}"? This action cannot be undone.`;
    
    if (!confirm(message)) {
      return;
    }
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/programs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete course");
        setDeletingId(null);
        return;
      }
      loadPrograms();
      router.refresh();
    } catch {
      alert("Network error");
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-white shadow-sm border border-[#e5e7eb] overflow-hidden animate-pulse"
          >
            <div className="h-44 bg-[var(--sidebar-bg)]" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-[var(--sidebar-bg)] rounded w-3/4" />
              <div className="h-4 bg-[var(--sidebar-bg)] rounded w-full" />
              <div className="h-4 bg-[var(--sidebar-bg)] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <>
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
          <p className="text-[#6b7280] dark:text-[#9ca3af] mb-4">
            {showCreateAction ? "No courses yet." : "No courses yet. Ask an admin or mentor to create a course."}
          </p>
          {showCreateAction && (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-block rounded-lg px-4 py-2 text-white font-medium"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              Create your first course
            </button>
          )}
        </div>
        {createModalOpen && userRole && (
          <CreateCourseModal
            userRole={userRole}
            onClose={() => setCreateModalOpen(false)}
            onSuccess={() => {
              loadPrograms();
              setCreateModalOpen(false);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-[#171717] dark:text-[#f9fafb] mb-6">
          Courses
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => {
            const startDate = formatStartDate(p.cohorts);
            const imageSrc = p.imageUrl || PLACEHOLDER_IMAGE;
            return (
              <article
                key={p.id}
                className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden flex flex-col"
              >
                <div className="relative h-44 bg-[var(--sidebar-bg)] overflow-hidden">
                  <img
                    src={imageSrc}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-[#171717] text-lg leading-tight">
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className="mt-2 text-sm text-[#6b7280] line-clamp-3">
                      {p.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-[#6b7280]">
                    {startDate && (
                      <>
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{startDate}</span>
                      </>
                    )}
                    {(startDate && p.duration) && (
                      <span className="text-[#d1d5db]">•</span>
                    )}
                    {p.duration && <span>{p.duration}</span>}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/dashboard/admin/programs/${p.id}`}
                      className="flex-1 rounded-lg border-2 py-2 text-center text-sm font-medium transition-colors"
                      style={{
                        borderColor: "var(--unipod-blue)",
                        color: "var(--unipod-blue)",
                      }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        // Calculate total module count across all courses
                        const moduleCount = p.courses?.reduce((sum, course) => sum + (course.modules?.length || 0), 0) || 0;
                        handleDelete(p.id, p.name, p.cohorts.length, moduleCount);
                      }}
                      disabled={deletingId === p.id}
                      className="flex-1 rounded-lg py-2 text-center text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#dc2626" }}
                    >
                      {deletingId === p.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      {showCreateAction && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-lg border-2 py-2.5 px-6 text-sm font-medium"
            style={{
              borderColor: "var(--unipod-blue)",
              color: "var(--unipod-blue)",
            }}
          >
            Create Course
          </button>
        </div>
      )}
      {createModalOpen && userRole && (
        <CreateCourseModal
          userRole={userRole}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            loadPrograms();
            setCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
