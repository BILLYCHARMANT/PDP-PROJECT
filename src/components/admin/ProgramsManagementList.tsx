"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgramForm } from "@/components/admin/ProgramForm";
import { AssignCoursesToProgram } from "@/components/admin/AssignCoursesToProgram";
import { CoursesList } from "@/components/admin/CoursesList";
import { AssignTraineesToProgram } from "@/components/admin/AssignTraineesToProgram";
import { CreateProgramModal } from "@/components/admin/CreateProgramModal";

type Program = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  duration: string | null;
  status: string;
  courses: { id: string; name: string; modules: { id: string; title: string; order: number }[] }[];
  cohorts: { id: string; name: string }[];
};

export function ProgramsManagementList({ showCreateAction = true }: { showCreateAction?: boolean }) {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "courses" | "assigned" | "trainees">("edit");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
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
  }, []);

  function handleRowClick(program: Program) {
    setSelectedProgram(program);
    setActiveTab("edit");
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setSelectedProgram(null);
    loadPrograms(); // Refresh the list after closing
    router.refresh();
  }

  async function handleDelete(id: string, name: string, courseCount: number, cohortCount: number) {
    const message = courseCount > 0 || cohortCount > 0
      ? `Delete program "${name}"? This will also affect ${courseCount} course(s) and ${cohortCount} cohort(s). This action cannot be undone.`
      : `Delete program "${name}"? This action cannot be undone.`;
    
    if (!confirm(message)) {
      return;
    }
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/programs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete program");
        setDeletingId(null);
        return;
      }
      if (selectedProgram?.id === id) {
        handleCloseModal();
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

  if (programs.length === 0) {
    return (
      <>
        <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-12 text-center">
          <p className="text-[#6b7280] dark:text-[#9ca3af] mb-4">
            {showCreateAction ? "No programs yet. Create your first UNIPOD program to get started." : "No programs yet. Ask an admin or mentor to create a program."}
          </p>
          {showCreateAction && (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-block rounded-lg px-4 py-2 text-white font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              Create Your First Program
            </button>
          )}
        </div>
        {createModalOpen && (
          <CreateProgramModal
            onClose={() => setCreateModalOpen(false)}
            onSuccess={() => {
              loadPrograms();
              router.refresh();
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      {showCreateAction && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            Create Program
          </button>
        </div>
      )}
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f9fafb] dark:bg-[#111827] border-b border-[#e5e7eb] dark:border-[#374151]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">
                  Program Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">
                  Courses
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">
                  Cohorts
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6b7280] dark:text-[#9ca3af]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#374151]">
              {programs.map((program) => {
                const courseCount = program.courses?.length ?? 0;
                const cohortCount = program.cohorts?.length ?? 0;
                return (
                  <tr
                    key={program.id}
                    onClick={() => handleRowClick(program)}
                    className="hover:bg-[#f9fafb] dark:hover:bg-[#1f2937] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {program.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={program.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <span className="font-medium text-[#171717] dark:text-[#f9fafb]">
                          {program.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] line-clamp-2 max-w-md">
                        {program.description || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-[#171717] dark:text-[#f9fafb]">
                        {courseCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-[#171717] dark:text-[#f9fafb]">
                        {cohortCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
                        {program.duration || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        program.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200"
                      }`}>
                        {program.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(program.id, program.name, courseCount, cohortCount);
                        }}
                        disabled={deletingId === program.id}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {deletingId === program.id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup */}
      {modalOpen && selectedProgram && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleCloseModal}
        >
          <div
            className="rounded-2xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] dark:border-[#374151]">
              <h2 className="text-xl font-bold text-[#171717] dark:text-[#f9fafb]">
                {selectedProgram.name}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#f9fafb] p-1 rounded transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#e5e7eb] dark:border-[#374151] bg-[#fafafa] dark:bg-[#111827]">
              <button
                onClick={() => setActiveTab("edit")}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "edit"
                    ? "bg-white dark:bg-[#1f2937] text-[#171717] dark:text-[#f9fafb] border-b-2 border-[var(--unipod-blue)]"
                    : "text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#f9fafb]"
                }`}
              >
                Edit Program
              </button>
              <button
                onClick={() => setActiveTab("courses")}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "courses"
                    ? "bg-white dark:bg-[#1f2937] text-[#171717] dark:text-[#f9fafb] border-b-2 border-[var(--unipod-blue)]"
                    : "text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#f9fafb]"
                }`}
              >
                Assign Courses
              </button>
              <button
                onClick={() => setActiveTab("assigned")}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "assigned"
                    ? "bg-white dark:bg-[#1f2937] text-[#171717] dark:text-[#f9fafb] border-b-2 border-[var(--unipod-blue)]"
                    : "text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#f9fafb]"
                }`}
              >
                Assigned Courses ({selectedProgram.courses.length})
              </button>
              <button
                onClick={() => setActiveTab("trainees")}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "trainees"
                    ? "bg-white dark:bg-[#1f2937] text-[#171717] dark:text-[#f9fafb] border-b-2 border-[var(--unipod-blue)]"
                    : "text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#f9fafb]"
                }`}
              >
                Assign Trainees
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "edit" && (
                <div className="space-y-6">
                  <ProgramForm
                    programId={selectedProgram.id}
                    initial={{
                      name: selectedProgram.name,
                      description: selectedProgram.description ?? "",
                      imageUrl: selectedProgram.imageUrl ?? "",
                      duration: selectedProgram.duration ?? "",
                    }}
                    onSuccess={() => {
                      loadPrograms();
                      router.refresh();
                    }}
                  />
                  <div className="pt-4 border-t border-[#e5e7eb] dark:border-[#374151]">
                    <button
                      onClick={() => handleDelete(selectedProgram.id, selectedProgram.name, selectedProgram.courses.length, selectedProgram.cohorts.length)}
                      disabled={deletingId === selectedProgram.id}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                      style={{ backgroundColor: "#dc2626" }}
                    >
                      {deletingId === selectedProgram.id ? "Deleting…" : "Delete Program"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "courses" && (
                <div className="space-y-4">
                  <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-4">
                    Assign existing courses to this program. Courses can be created independently and then assigned to programs.
                  </p>
                  <AssignCoursesToProgram
                    programId={selectedProgram.id}
                    assignedCourseIds={selectedProgram.courses.map((c) => c.id)}
                    onSuccess={() => {
                      loadPrograms();
                      // Update selectedProgram with fresh data
                      fetch("/api/programs")
                        .then((r) => r.json())
                        .then((data) => {
                          const updated = Array.isArray(data) ? data.find((p: Program) => p.id === selectedProgram.id) : null;
                          if (updated) {
                            setSelectedProgram(updated);
                          }
                        });
                    }}
                  />
                </div>
              )}

              {activeTab === "assigned" && (
                <div className="space-y-4">
                  <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-4">
                    Courses assigned to this program. Click on a course to manage its modules and lessons.
                  </p>
                  <CoursesList
                    programId={selectedProgram.id}
                    courses={selectedProgram.courses.map((c) => ({
                      id: c.id,
                      name: c.name,
                      description: null,
                      imageUrl: null,
                      duration: null,
                      modules: c.modules,
                    }))}
                  />
                </div>
              )}

              {activeTab === "trainees" && (
                <div className="space-y-4">
                  <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] mb-4">
                    Assign trainees to cohorts in this program. Trainees must be enrolled in a cohort to access program content.
                  </p>
                  <AssignTraineesToProgram programId={selectedProgram.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Program Modal */}
      {createModalOpen && (
        <CreateProgramModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            loadPrograms();
            router.refresh();
          }}
        />
      )}
    </>
  );
}
