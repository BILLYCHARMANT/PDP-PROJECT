"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApproveCourseModal } from "@/components/admin/ApproveCourseModal";
import { CreateCourseModal } from "@/components/admin/CreateCourseModal";
import { EditCourseModal } from "@/components/admin/EditCourseModal";

type Course = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  duration: string | null;
  programId: string | null;
  program: { id: string; name: string } | null;
  modules: { id: string; title: string; order: number }[];
  status: string;
};

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=220&fit=crop";

export function AllCoursesList({ userRole: propUserRole }: { userRole?: string | null }) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [approvingCourse, setApprovingCourse] = useState<Course | null>(null);
  const [userRole, setUserRole] = useState<string | null>(propUserRole || null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"approved" | "pending">("approved");

  function loadCourses() {
    setLoading(true);
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadCourses();
    // Fetch user role to check if admin (only if not provided as prop)
    if (!propUserRole) {
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((data) => {
          if (data?.user?.role) {
            setUserRole(data.user.role);
          }
        })
        .catch(() => {});
    }
  }, [propUserRole]);

  async function handleDelete(id: string, name: string, moduleCount: number) {
    const message = moduleCount > 0
      ? `Delete course "${name}"? This will also delete ${moduleCount} module(s) (including all lessons and assignments). This action cannot be undone.`
      : `Delete course "${name}"? This action cannot be undone.`;
    
    if (!confirm(message)) {
      return;
    }
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete course");
        setDeletingId(null);
        return;
      }
      loadCourses();
      router.refresh();
    } catch {
      alert("Network error");
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-[var(--sidebar-bg)]" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 border-t border-[#e5e7eb] dark:border-[#374151] bg-[var(--sidebar-bg)]" />
          ))}
        </div>
      </div>
    );
  }

  // Separate courses into approved and pending
  const approvedCourses = courses.filter((c) => c.status === "ACTIVE" || c.status === "INACTIVE");
  const pendingCourses = courses.filter((c) => c.status === "PENDING");

  if (courses.length === 0) {
    return (
      <>
        <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-12 text-center">
          <p className="text-[#6b7280] dark:text-[#9ca3af] mb-4">
            No courses yet.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-block rounded-lg px-4 py-2 text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            Create your first course
          </button>
        </div>
        {createModalOpen && userRole && (
          <CreateCourseModal
            userRole={userRole}
            onClose={() => setCreateModalOpen(false)}
            onSuccess={() => {
              loadCourses();
              setCreateModalOpen(false);
            }}
          />
        )}
      </>
    );
  }

  const canCreate = userRole === "ADMIN" || userRole === "MENTOR";
  const showPendingTab = userRole === "ADMIN";

  const tableHeaders = (
    <tr>
      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">Course</th>
      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">Description</th>
      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">Modules</th>
      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">Program</th>
      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">Status</th>
      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">Actions</th>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "approved"
                ? "bg-white dark:bg-[#1f2937] text-[#171717] dark:text-[#f9fafb] shadow-sm"
                : "text-[#6b7280] dark:text-[#9ca3af] hover:text-[#171717] dark:hover:text-[#f9fafb]"
            }`}
          >
            Approved Courses ({approvedCourses.length})
          </button>
          {showPendingTab && (
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "pending"
                  ? "bg-white dark:bg-[#1f2937] text-[#171717] dark:text-[#f9fafb] shadow-sm"
                  : "text-[#6b7280] dark:text-[#9ca3af] hover:text-[#171717] dark:hover:text-[#f9fafb]"
              }`}
            >
              Pending Approval ({pendingCourses.length})
            </button>
          )}
        </div>
        {canCreate && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            Create Course
          </button>
        )}
      </div>

      {/* Tab content: table for active tab */}
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] overflow-hidden shadow-sm">
        {activeTab === "approved" && (
          approvedCourses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[#6b7280] dark:text-[#9ca3af]">No approved courses yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f9fafb] dark:bg-[#111827] border-b border-[#e5e7eb] dark:border-[#374151]">
                  {tableHeaders}
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#374151]">
                  {approvedCourses.map((course) => {
                    const imageSrc = course.imageUrl || PLACEHOLDER_IMAGE;
                    return (
                      <tr
                        key={course.id}
                        onClick={() => router.push(`/dashboard/admin/programs/${course.id}`)}
                        className="hover:bg-[#f9fafb] dark:hover:bg-[#1f2937] transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={imageSrc} alt="" className="w-12 h-12 rounded object-cover" />
                            <span className="font-medium text-[#171717] dark:text-[#f9fafb]">{course.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] line-clamp-2 max-w-md">{course.description || "—"}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-[#171717] dark:text-[#f9fafb]">{course.modules.length}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {course.program ? (
                            <span className="text-sm text-[var(--unipod-blue)]">{course.program.name}</span>
                          ) : (
                            <span className="text-sm text-[#6b7280] dark:text-[#9ca3af]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                            {course.status === "ACTIVE" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setEditingCourseId(course.id)} className="text-[var(--unipod-blue)] hover:underline text-sm font-medium">Edit</button>
                            <button
                              onClick={() => handleDelete(course.id, course.name, course.modules.length)}
                              disabled={deletingId === course.id}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              {deletingId === course.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === "pending" && showPendingTab && (
          pendingCourses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[#6b7280] dark:text-[#9ca3af]">No courses pending approval.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f9fafb] dark:bg-[#111827] border-b border-[#e5e7eb] dark:border-[#374151]">
                  {tableHeaders}
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#374151]">
                  {pendingCourses.map((course) => {
                    const imageSrc = course.imageUrl || PLACEHOLDER_IMAGE;
                    return (
                      <tr
                        key={course.id}
                        onClick={() => router.push(`/dashboard/admin/programs/${course.id}`)}
                        className="hover:bg-[#f9fafb] dark:hover:bg-[#1f2937] transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={imageSrc} alt="" className="w-12 h-12 rounded object-cover" />
                            <span className="font-medium text-[#171717] dark:text-[#f9fafb]">{course.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] line-clamp-2 max-w-md">{course.description || "—"}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-[#171717] dark:text-[#f9fafb]">{course.modules.length}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {course.program ? (
                            <span className="text-sm text-[var(--unipod-blue)]">{course.program.name}</span>
                          ) : (
                            <span className="text-sm text-[#6b7280] dark:text-[#9ca3af]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                            Pending Approval
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setApprovingCourse(course)} className="text-[var(--unipod-blue)] hover:underline text-sm font-medium">Approve</button>
                            <button onClick={() => setEditingCourseId(course.id)} className="text-[#6b7280] dark:text-[#9ca3af] hover:text-[#171717] dark:hover:text-[#f9fafb] text-sm font-medium">Edit</button>
                            <button
                              onClick={() => handleDelete(course.id, course.name, course.modules.length)}
                              disabled={deletingId === course.id}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              {deletingId === course.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
      
      {/* Approve Course Modal */}
      {approvingCourse && (
        <ApproveCourseModal
          courseId={approvingCourse.id}
          courseName={approvingCourse.name}
          currentProgramId={approvingCourse.programId}
          onClose={() => setApprovingCourse(null)}
          onSuccess={() => {
            loadCourses();
            setApprovingCourse(null);
          }}
        />
      )}

      {/* Create Course Modal */}
      {createModalOpen && userRole && (
        <CreateCourseModal
          userRole={userRole}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            loadCourses();
            setCreateModalOpen(false);
          }}
        />
      )}

      {/* Edit Course Modal */}
      {editingCourseId && userRole && (
        <EditCourseModal
          courseId={editingCourseId}
          userRole={userRole}
          onClose={() => setEditingCourseId(null)}
          onSuccess={() => {
            loadCourses();
            setEditingCourseId(null);
          }}
        />
      )}
    </div>
  );
}
