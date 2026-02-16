"use client";

import { useEffect, useState } from "react";
import { ModuleForm } from "./ModuleForm";

type ModuleData = {
  id: string;
  title: string;
  description: string | null;
  inspiringQuotes: string | null;
  order: number;
  startDate: string | null;
  endDate: string | null;
};

export function EditModuleModal({
  courseId,
  moduleId,
  onClose,
  onSuccess,
}: {
  courseId: string;
  moduleId: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/modules/${moduleId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.id) {
          setModuleData({
            id: data.id,
            title: data.title ?? "",
            description: data.description ?? null,
            inspiringQuotes: data.inspiringQuotes ?? null,
            order: data.order ?? 0,
            startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
            endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
          });
        } else {
          setError("Module not found");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load module");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="rounded-2xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] dark:border-[#374151]">
          <h2 className="text-xl font-bold text-[#171717] dark:text-[#f9fafb]">Edit Module</h2>
          <button
            onClick={onClose}
            className="text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#f9fafb] p-1 rounded transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Loading module…</p>
          )}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {!loading && moduleData && (
            <ModuleForm
              courseId={courseId}
              moduleId={moduleId}
              initial={{
                title: moduleData.title,
                description: moduleData.description ?? undefined,
                inspiringQuotes: moduleData.inspiringQuotes ?? undefined,
                order: moduleData.order,
                startDate: moduleData.startDate,
                endDate: moduleData.endDate,
              }}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
