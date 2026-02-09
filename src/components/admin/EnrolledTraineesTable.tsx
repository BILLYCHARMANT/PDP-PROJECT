"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Enrollment = {
  id: string;
  traineeId: string;
  enrolledAt: Date | string;
  atRisk: boolean;
  extendedEndDate: Date | string | null;
  lastReminderAt: Date | string | null;
  trainee: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    active: boolean;
    createdAt: Date | string;
    imageUrl: string | null;
  };
};

type ProgressData = {
  traineeId: string;
  moduleId: string;
  percentComplete: number;
  status: string;
  completedAt: Date | string | null;
};

type SubmissionData = {
  traineeId: string;
  status: string;
  submittedAt: Date | string;
  reviewedAt: Date | string | null;
};

export function EnrolledTraineesTable({
  enrollments,
  progressData,
  submissionData,
  moduleCount,
}: {
  enrollments: Enrollment[];
  progressData: ProgressData[];
  submissionData: SubmissionData[];
  moduleCount: number;
}) {
  const [sortBy, setSortBy] = useState<"name" | "enrolledAt" | "progress" | "submissions">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate stats for each trainee
  const traineeStats = useMemo(() => {
    const stats: Record<
      string,
      {
        avgProgress: number;
        completedModules: number;
        totalSubmissions: number;
        pendingSubmissions: number;
        approvedSubmissions: number;
        lastActivity: Date | null;
      }
    > = {};

    enrollments.forEach((e) => {
      const traineeProgress = progressData.filter((p) => p.traineeId === e.traineeId);
      const traineeSubmissions = submissionData.filter((s) => s.traineeId === e.traineeId);

      const avgProgress =
        traineeProgress.length > 0
          ? Math.round(
              traineeProgress.reduce((sum, p) => sum + p.percentComplete, 0) /
                traineeProgress.length
            )
          : 0;

      const completedModules = traineeProgress.filter(
        (p) => p.status === "COMPLETED" || p.percentComplete === 100
      ).length;

      const totalSubmissions = traineeSubmissions.length;
      const pendingSubmissions = traineeSubmissions.filter(
        (s) => s.status === "PENDING" || s.status === "RESUBMIT_REQUESTED"
      ).length;
      const approvedSubmissions = traineeSubmissions.filter((s) => s.status === "APPROVED").length;

      const lastActivity = [
        ...traineeSubmissions.map((s) => new Date(s.submittedAt)),
        ...traineeProgress
          .map((p) => (p.completedAt ? new Date(p.completedAt) : null))
          .filter((d): d is Date => d !== null),
      ]
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;

      stats[e.traineeId] = {
        avgProgress,
        completedModules,
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        lastActivity,
      };
    });

    return stats;
  }, [enrollments, progressData, submissionData]);

  // Filter and sort enrollments
  const filteredAndSorted = useMemo(() => {
    let filtered = enrollments.filter((e) => {
      const search = searchTerm.toLowerCase();
      return (
        e.trainee.name.toLowerCase().includes(search) ||
        e.trainee.email.toLowerCase().includes(search) ||
        e.trainee.phone?.toLowerCase().includes(search) ||
        ""
      );
    });

    filtered.sort((a, b) => {
      let aVal: string | number | Date;
      let bVal: string | number | Date;

      switch (sortBy) {
        case "name":
          aVal = a.trainee.name.toLowerCase();
          bVal = b.trainee.name.toLowerCase();
          break;
        case "enrolledAt":
          aVal = new Date(a.enrolledAt);
          bVal = new Date(b.enrolledAt);
          break;
        case "progress":
          aVal = traineeStats[a.traineeId]?.avgProgress ?? 0;
          bVal = traineeStats[b.traineeId]?.avgProgress ?? 0;
          break;
        case "submissions":
          aVal = traineeStats[a.traineeId]?.totalSubmissions ?? 0;
          bVal = traineeStats[b.traineeId]?.totalSubmissions ?? 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [enrollments, searchTerm, sortBy, sortOrder, traineeStats]);

  function handleSort(field: typeof sortBy) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }

  function SortIcon({ field }: { field: typeof sortBy }) {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  }

  function formatDate(date: Date | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(date: Date | null) {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm"
        />
        <span className="text-sm text-[#6b7280]">
          {filteredAndSorted.length} of {enrollments.length} trainees
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[var(--sidebar-bg)]">
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] cursor-pointer hover:bg-[#f3f4f6]"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Name <SortIcon field="name" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                Contact
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] cursor-pointer hover:bg-[#f3f4f6]"
                onClick={() => handleSort("enrolledAt")}
              >
                <div className="flex items-center gap-1">
                  Enrolled <SortIcon field="enrolledAt" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                Status
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] cursor-pointer hover:bg-[#f3f4f6]"
                onClick={() => handleSort("progress")}
              >
                <div className="flex items-center gap-1">
                  Progress <SortIcon field="progress" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] cursor-pointer hover:bg-[#f3f4f6]"
                onClick={() => handleSort("submissions")}
              >
                <div className="flex items-center gap-1">
                  Submissions <SortIcon field="submissions" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                Last Activity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {filteredAndSorted.map((enrollment) => {
              const stats = traineeStats[enrollment.traineeId] ?? {
                avgProgress: 0,
                completedModules: 0,
                totalSubmissions: 0,
                pendingSubmissions: 0,
                approvedSubmissions: 0,
                lastActivity: null,
              };

              return (
                <tr
                  key={enrollment.id}
                  className="hover:bg-[#f9fafb] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        {enrollment.trainee.imageUrl ? (
                          <img
                            src={enrollment.trainee.imageUrl}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[var(--unipod-blue)] flex items-center justify-center text-white text-xs font-medium">
                            {enrollment.trainee.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-[#171717]">
                          {enrollment.trainee.name}
                          {!enrollment.trainee.active && (
                            <span className="ml-2 text-xs text-red-600">(Inactive)</span>
                          )}
                        </div>
                        <div className="text-xs text-[#6b7280]">
                          Joined: {formatDate(enrollment.trainee.createdAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-[#374151]">
                      <div>{enrollment.trainee.email}</div>
                      {enrollment.trainee.phone && (
                        <div className="text-xs text-[#6b7280] mt-1">
                          {enrollment.trainee.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#374151]">
                    {formatDate(enrollment.enrolledAt)}
                    {enrollment.extendedEndDate && (
                      <div className="text-xs text-[#6b7280] mt-1">
                        Extended: {formatDate(enrollment.extendedEndDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {enrollment.atRisk && (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                          At Risk
                        </span>
                      )}
                      {enrollment.lastReminderAt && (
                        <div className="text-xs text-[#6b7280]">
                          Reminded: {formatDate(enrollment.lastReminderAt)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#e5e7eb] rounded-full h-2 max-w-[100px]">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${stats.avgProgress}%`,
                              backgroundColor:
                                stats.avgProgress >= 80
                                  ? "#10b981"
                                  : stats.avgProgress >= 50
                                  ? "#f59e0b"
                                  : "#ef4444",
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-[#374151] min-w-[3ch]">
                          {stats.avgProgress}%
                        </span>
                      </div>
                      <div className="text-xs text-[#6b7280]">
                        {stats.completedModules}/{moduleCount} modules
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-[#374151]">
                      <div>Total: {stats.totalSubmissions}</div>
                      <div className="text-xs text-[#6b7280] space-x-2 mt-1">
                        <span className="text-green-600">✓ {stats.approvedSubmissions}</span>
                        <span className="text-amber-600">⏳ {stats.pendingSubmissions}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#374151]">
                    {stats.lastActivity ? formatDateTime(stats.lastActivity) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`mailto:${enrollment.trainee.email}`}
                      className="text-sm font-medium"
                      style={{ color: "var(--unipod-blue)" }}
                    >
                      Email
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
