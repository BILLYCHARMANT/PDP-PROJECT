"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

type User = {
  id: string;
  email: string;
  name: string;
  imageUrl?: string | null;
  phone?: string | null;
  role: string;
  active: boolean;
  createdAt: string;
};

type UserDetails = {
  id: string;
  email: string;
  name: string;
  imageUrl?: string | null;
  phone?: string | null;
  role: string;
  active: boolean;
  createdAt: string;
  stats: {
    enrollments: number;
    submissions: number;
    feedbackGiven: number;
    cohortsMentoring: number;
    certificates: number;
    submissionStatusCounts: { PENDING: number; APPROVED: number; REJECTED: number; RESUBMIT_REQUESTED: number };
    onTimeDeliveryRate: number;
  };
  recentEnrollments: { id: string; programName: string; cohortName: string; enrolledAt: string }[];
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-[var(--unipod-blue-light)] text-[var(--unipod-blue)]",
  MENTOR: "bg-[var(--unipod-yellow-bg)] text-[#b45309]",
  TRAINEE: "bg-[#e0e7ff] text-[#4338ca]",
};

const roleAvatar: Record<string, string> = {
  ADMIN: "/avatars/admin.png",
  MENTOR: "/avatars/mentor.png",
  TRAINEE: "/avatars/trainee.png",
};

function formatRwandaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 9) {
    const last9 = digits.slice(-9);
    return `+250 ${last9.slice(0, 3)} ${last9.slice(3, 6)} ${last9.slice(6)}`;
  }
  return raw;
}

function UserAvatar({ role, imageUrl, name, size = 48 }: { role: string; imageUrl?: string | null; name?: string; size?: number }) {
  const defaultSrc = roleAvatar[role] ?? null;
  const src = imageUrl || defaultSrc;
  const className = "rounded-full object-cover shrink-0";
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={className}
        unoptimized={typeof src === "string" && src.startsWith("/api/")}
      />
    );
  }
  const initials = (name || "U").slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full bg-[var(--unipod-blue-light)] dark:bg-[#374151] flex items-center justify-center font-semibold shrink-0 text-[var(--unipod-blue)] dark:text-[#d1d5db]"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

export function AdminUsersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [togglingActive, setTogglingActive] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setUserDetails(null);
      return;
    }
    setDetailsLoading(true);
    fetch(`/api/admin/users/${selectedUserId}`)
      .then((r) => r.json())
      .then((data) => {
        setUserDetails(data?.id ? data : null);
        setDetailsLoading(false);
      })
      .catch(() => setDetailsLoading(false));
  }, [selectedUserId]);

  const roleFiltered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;
  const filteredUsers = search.trim()
    ? roleFiltered.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : roleFiltered;

  const toggleActive = (userId: string, currentActive: boolean) => {
    setTogglingActive(userId);
    fetch(`/api/admin/users/${userId}/active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !currentActive }),
    })
      .then((r) => r.json())
      .then(() => {
        setTogglingActive(null);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, active: !currentActive } : u))
        );
        if (userDetails?.id === userId) {
          setUserDetails((d) => (d ? { ...d, active: !currentActive } : null));
        }
      })
      .catch(() => setTogglingActive(null));
  };

  const tabs = [
    { value: "", label: "All", count: users.length },
    { value: "ADMIN", label: "Admin", count: users.filter((u) => u.role === "ADMIN").length },
    { value: "MENTOR", label: "Mentor", count: users.filter((u) => u.role === "MENTOR").length },
    { value: "TRAINEE", label: "Trainee", count: users.filter((u) => u.role === "TRAINEE").length },
  ];

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const [page, setPage] = useState(1);
  const paginatedUsers = useMemo(
    () => filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredUsers, page]
  );
  useEffect(() => setPage(1), [roleFilter, search]);

  const submissionDonutData = userDetails
    ? [
        { name: "Approved", value: userDetails.stats.submissionStatusCounts.APPROVED, color: "var(--unipod-green)" },
        { name: "Pending", value: userDetails.stats.submissionStatusCounts.PENDING, color: "var(--unipod-blue)" },
        { name: "Rejected", value: userDetails.stats.submissionStatusCounts.REJECTED, color: "#dc2626" },
        { name: "Resubmit", value: userDetails.stats.submissionStatusCounts.RESUBMIT_REQUESTED, color: "var(--unipod-yellow)" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main: breadcrumb, actions, tabs, search, grid — SHIPNOW-style layout */}
      <div className="min-w-0 flex-1 order-2 lg:order-1">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Dashboard / Users</p>
            <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Users</h1>
          </div>
          <Link
            href="/dashboard/admin/users/register"
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-white shrink-0"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            + Add New User
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setRoleFilter(tab.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                roleFilter === tab.value
                  ? "bg-[var(--unipod-blue)] text-white shadow-sm"
                  : "bg-white dark:bg-[#1f2937] border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] dark:text-[#9ca3af] pointer-events-none">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search user"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] pl-9 pr-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb] placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[var(--unipod-blue)]"
            />
          </div>
          <button
            type="button"
            className="p-2.5 rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] text-[#6b7280] dark:text-[#9ca3af] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]"
            aria-label="Filter"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {loading ? (
          <p className="text-[#6b7280] py-8">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`rounded-xl border bg-white dark:bg-[#1f2937] overflow-hidden shadow-sm cursor-pointer transition-all hover:shadow-md flex flex-col min-h-0 ${
                    selectedUserId === u.id
                      ? "ring-2 ring-[var(--unipod-blue)] border-[var(--unipod-blue)]"
                      : "border-[#e5e7eb] dark:border-[#374151]"
                  }`}
                >
                  {/* Top: avatar and name centered; contacts aligned to card edges */}
                  <div className="px-5 pt-5 pb-3">
                    <div className="flex flex-col items-center text-center">
                      <UserAvatar role={u.role} imageUrl={u.imageUrl} name={u.name} size={56} />
                      <p className="mt-2 font-bold text-[#171717] dark:text-[#f9fafb] truncate w-full">{u.name}</p>
                      <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#e5e7eb] dark:bg-[#374151] text-[#6b7280] dark:text-[#9ca3af]">
                          {u.id.slice(0, 6).toUpperCase()}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"}`}>
                          {u.active ? "Active" : "Off duty"}
                        </span>
                      </div>
                    </div>
                    {/* Contacts: icon+label left, value right — same padding from card edges */}
                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 text-[#6b7280] dark:text-[#9ca3af] shrink-0">
                          <svg className="h-4 w-4 text-[#6b7280] dark:text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Phone
                        </span>
                        <span className="truncate text-[#374151] dark:text-[#d1d5db] font-medium text-right min-w-0">
                          {u.phone ? formatRwandaPhone(u.phone) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 text-[#6b7280] dark:text-[#9ca3af] shrink-0">
                          <svg className="h-4 w-4 text-[#6b7280] dark:text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email
                        </span>
                        <span className="truncate text-[#374151] dark:text-[#d1d5db] font-medium text-right min-w-0">{u.email}</span>
                      </div>
                    </div>
                  </div>
                  {/* Bottom strip: role */}
                  <div className="px-5 py-2.5 bg-[var(--sidebar-bg)] dark:bg-[#374151] flex items-center justify-center gap-2">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white dark:bg-[#1f2937] shadow-sm" style={{ color: "var(--unipod-blue)" }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /></svg>
                    </span>
                    <span className="text-sm font-medium text-[#374151] dark:text-[#d1d5db]">{u.role}</span>
                  </div>
                  <div className="px-5 py-2 border-t border-[#e5e7eb] dark:border-[#374151] flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedUserId(u.id); }}
                      className="flex-1 rounded-lg py-2 text-xs font-medium text-white"
                      style={{ backgroundColor: "var(--unipod-blue)" }}
                    >
                      View details
                    </button>
                    {u.role !== "ADMIN" && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleActive(u.id, u.active); }}
                        disabled={togglingActive === u.id}
                        className="rounded-lg py-2 px-3 text-xs font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151] disabled:opacity-50"
                      >
                        {togglingActive === u.id ? "…" : u.active ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {filteredUsers.length === 0 && (
              <p className="text-[#6b7280] py-8 text-center">No users match your filters.</p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
                Show {paginatedUsers.length} of {filteredUsers.length} results
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-[#e5e7eb] dark:border-[#374151] disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`min-w-[2rem] py-1.5 rounded-lg text-sm font-medium ${
                        page === n ? "bg-[var(--unipod-blue)] text-white" : "border border-[#e5e7eb] dark:border-[#374151] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-[#e5e7eb] dark:border-[#374151] disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right sidebar: always visible — SHIPNOW-style cards + overview */}
      <aside className="w-full lg:w-80 shrink-0 order-1 lg:order-2 rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] overflow-hidden shadow-sm lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="p-4 border-b border-[#e5e7eb] dark:border-[#374151] flex items-center justify-between">
          <h2 className="font-semibold text-[#171717] dark:text-[#f9fafb]">
            {selectedUserId ? "User details" : "Overview"}
          </h2>
          <div className="flex items-center gap-1">
            {selectedUserId && (
              <button type="button" className="p-1.5 rounded-lg text-[#6b7280] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]" aria-label="More options">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="6" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="18" r="1.5" /></svg>
              </button>
            )}
            {selectedUserId && (
              <button type="button" onClick={() => setSelectedUserId(null)} className="p-1.5 rounded-lg text-[#6b7280] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]" aria-label="Close">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
        <div className="p-4 space-y-4">
          {selectedUserId ? (
            detailsLoading ? (
              <p className="text-[#6b7280] text-sm">Loading…</p>
            ) : userDetails ? (
              <>
                <div className="flex items-center gap-3">
                  <UserAvatar role={userDetails.role} imageUrl={userDetails.imageUrl} name={userDetails.name} size={56} />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#171717] dark:text-[#f9fafb] truncate">{userDetails.name}</p>
                    <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] truncate">{userDetails.email}</p>
                    {userDetails.phone && (
                      <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] truncate">{formatRwandaPhone(userDetails.phone)}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[userDetails.role] ?? ""}`}>{userDetails.role}</span>
                      {userDetails.role !== "ADMIN" && (
                        <button type="button" onClick={() => toggleActive(userDetails.id, userDetails.active)} disabled={togglingActive === userDetails.id} className="rounded-lg py-1 px-2 text-xs font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] disabled:opacity-50">
                          {userDetails.active ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity / Progress card (like Shipment Tracking) */}
                <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] p-3">
                  <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-2">Activity</h3>
                  <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mb-2">Enrollments & submissions</p>
                  <div className="h-2 rounded-full bg-[var(--sidebar-bg)] dark:bg-[#374151] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--unipod-blue)]" style={{ width: `${userDetails.stats.enrollments ? Math.min(100, (userDetails.stats.submissions / Math.max(1, userDetails.stats.enrollments * 5)) * 100) : 0}%` }} />
                  </div>
                  <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1">Progress: {userDetails.stats.submissions} submissions across {userDetails.stats.enrollments} enrollment(s)</p>
                </div>

                {/* User statistic card (like Shipment Statistic) */}
                <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] p-3">
                  <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-2">User statistic</h3>
                  <p className="text-2xl font-bold" style={{ color: "var(--unipod-blue)" }}>{userDetails.stats.submissions}</p>
                  <p className="text-xs text-[#6b7280] dark:text-[#9ca3af]">Total submissions</p>
                  <ul className="mt-2 space-y-1 text-sm text-[#374151] dark:text-[#d1d5db]">
                    <li>Enrollments: {userDetails.stats.enrollments}</li>
                    {userDetails.role === "MENTOR" && <li>Feedback given: {userDetails.stats.feedbackGiven}</li>}
                    <li>Certificates: {userDetails.stats.certificates}</li>
                  </ul>
                </div>

                {/* Performance metrics card */}
                <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] p-3">
                  <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-2">Performance metrics</h3>
                  <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mb-1">Approval rate</p>
                  <div className="h-3 rounded-full bg-[var(--sidebar-bg)] dark:bg-[#374151] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--unipod-blue)]" style={{ width: `${userDetails.stats.onTimeDeliveryRate}%` }} />
                  </div>
                  <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1">{userDetails.stats.onTimeDeliveryRate}% · {userDetails.stats.submissionStatusCounts.APPROVED} / {userDetails.stats.submissionStatusCounts.APPROVED + userDetails.stats.submissionStatusCounts.PENDING + userDetails.stats.submissionStatusCounts.REJECTED + userDetails.stats.submissionStatusCounts.RESUBMIT_REQUESTED} submissions approved</p>
                </div>

                {/* Submission status breakdown — donut + legend (like Delay Reasons) */}
                <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] p-3">
                  <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-2">Submission status breakdown</h3>
                  <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mb-2">{userDetails.stats.submissionStatusCounts.APPROVED + userDetails.stats.submissionStatusCounts.PENDING + userDetails.stats.submissionStatusCounts.REJECTED + userDetails.stats.submissionStatusCounts.RESUBMIT_REQUESTED} total</p>
                  {submissionDonutData.length > 0 ? (
                    <>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={submissionDonutData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" nameKey="name">
                              {submissionDonutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(v: number | undefined) => [v ?? 0, ""]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 space-y-1 text-xs">
                        {submissionDonutData.map((d) => {
                          const total = submissionDonutData.reduce((s, x) => s + x.value, 0);
                          const pct = total ? Math.round((d.value / total) * 100) : 0;
                          return (
                            <div key={d.name} className="flex justify-between items-center">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} /><span className="text-[#374151] dark:text-[#d1d5db]">{d.name}</span></span>
                              <span className="text-[#6b7280]">{pct}% | {d.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#6b7280]">No submissions yet.</p>
                  )}
                </div>

                {userDetails.recentEnrollments.length > 0 && (
                  <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] p-3">
                    <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-2">Enrollments</h3>
                    <ul className="space-y-2 text-sm">
                      {userDetails.recentEnrollments.map((e) => (
                        <li key={e.id} className="text-[#374151] dark:text-[#d1d5db]">
                          <span className="font-medium">{e.programName}</span> – {e.cohortName}
                          <br /><span className="text-xs text-[#6b7280]">{new Date(e.enrolledAt).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[#6b7280]">Could not load user.</p>
            )
          ) : (
            /* Overall statistics when no user selected */
            <>
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Select a user card to view their details and performance.</p>

              <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] p-3">
                <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-2">Total users</h3>
                <p className="text-2xl font-bold" style={{ color: "var(--unipod-blue)" }}>{users.length}</p>
                <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1">Registered in the system</p>
              </div>

              <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] p-3">
                <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-3">Users by role</h3>
                <div className="space-y-2">
                  {(["ADMIN", "MENTOR", "TRAINEE"] as const).map((role) => {
                    const count = users.filter((u) => u.role === role).length;
                    const pct = users.length ? Math.round((count / users.length) * 100) : 0;
                    return (
                      <div key={role}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-[#374151] dark:text-[#d1d5db]">{role}</span>
                          <span className="font-medium">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--sidebar-bg)] dark:bg-[#374151] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: role === "ADMIN" ? "var(--unipod-blue)" : role === "MENTOR" ? "var(--unipod-yellow)" : "#6366f1",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] p-3">
                <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-2">Status breakdown</h3>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg bg-green-50 dark:bg-green-900/20 p-2 text-center">
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">{users.filter((u) => u.active).length}</p>
                    <p className="text-xs text-green-600 dark:text-green-500">Active</p>
                  </div>
                  <div className="flex-1 rounded-lg bg-red-50 dark:bg-red-900/20 p-2 text-center">
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{users.filter((u) => !u.active).length}</p>
                    <p className="text-xs text-red-600 dark:text-red-500">Inactive</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] p-3">
                <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-2">Role distribution</h3>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--unipod-blue)]" />
                    <span className="text-[#374151] dark:text-[#d1d5db]">Admin – {users.filter((u) => u.role === "ADMIN").length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--unipod-yellow)]" />
                    <span className="text-[#374151] dark:text-[#d1d5db]">Mentor – {users.filter((u) => u.role === "MENTOR").length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#6366f1]" />
                    <span className="text-[#374151] dark:text-[#d1d5db]">Trainee – {users.filter((u) => u.role === "TRAINEE").length}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
