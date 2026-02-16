"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  MENTOR: "Mentor",
  TRAINEE: "Trainee",
};

type NavItem = { href: string; label: string; icon: "home" | "calendar" | "folder" | "quiz" | "cap" | "doc" | "user" | "chart" | "users" | "bell" | "cog" | "book" };
type NavGroup = { group: string; icon: NavItem["icon"]; items: { href: string; label: string }[] };
type NavEntry = NavItem | NavGroup;
function isNavGroup(e: NavEntry): e is NavGroup {
  return "group" in e && "items" in e;
}

const icons: Record<NavItem["icon"], React.ReactNode> = {
  home: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  calendar: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  folder: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  quiz: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  cap: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  doc: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  user: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  chart: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  users: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  bell: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  cog: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  book: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
};

export function DashboardShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; role: Role };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = "/dashboard";

  // Programs: Program management (new feature)
  // My Courses: Course List + Create Course for admin/mentor (CRUD); trainee sees My learning only (read + assignments).
  const adminLinks: NavEntry[] = [
    { href: base, label: "Home", icon: "home" },
    { href: `${base}/admin/programs-management`, label: "Programs", icon: "folder" },
    { href: `${base}/admin/programs`, label: "Course List", icon: "folder" },
    { href: `${base}/admin/cohorts`, label: "Cohorts", icon: "users" },
    { href: `${base}/admin/schedule-requests`, label: "Schedule requests", icon: "calendar" },
    { href: `${base}/admin/users`, label: "Users", icon: "user" },
    { href: `${base}/admin/analytics`, label: "Analytics", icon: "chart" },
    { href: `${base}/admin/submissions/grade`, label: "Confirm grades", icon: "quiz" },
  ];
  const mentorLinks: NavEntry[] = [
    { href: base, label: "Home", icon: "home" },
    { group: "Programs", icon: "folder", items: [
      { href: `${base}/admin/programs-management`, label: "Programs" },
    ]},
    { href: `${base}/mentor/programs`, label: "Course List", icon: "folder" },
    { href: `${base}/mentor/submissions/grade`, label: "Grading", icon: "quiz" },
    { href: `${base}/mentor/planning`, label: "Planning", icon: "calendar" },
    { href: `${base}/mentor/technical-support`, label: "Technical support", icon: "user" },
    { href: `${base}/mentor/materials`, label: "Materials", icon: "book" },
    { href: `${base}/mentor/reminders`, label: "Reminders", icon: "bell" },
  ];
  const traineeLinks: NavEntry[] = [
    { href: base, label: "Home", icon: "home" },
    { group: "My Courses", icon: "cap", items: [
      { href: `${base}/trainee/learn`, label: "My learning" },
    ]},
    { href: `${base}/trainee/planning`, label: "My Planning", icon: "calendar" },
    { href: `${base}/trainee/projects`, label: "Projects", icon: "folder" },
    { href: `${base}/trainee/submissions`, label: "Submissions", icon: "quiz" },
    { href: `${base}/trainee/concepts`, label: "Materials", icon: "doc" },
  ];

  const links =
    user.role === "ADMIN"
      ? adminLinks
      : user.role === "MENTOR"
        ? mentorLinks
        : traineeLinks;

  const initials = (user.name || user.email || "U")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-[#111827]">
      {/* Top header bar */}
      <header className="h-14 flex-shrink-0 border-b border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] flex items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button type="button" className="p-2 text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] rounded-lg md:hidden shrink-0" aria-label="Menu">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href={base} className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold text-[var(--unipod-blue)]">UNIPOD</span>
            <span className="text-xl font-bold text-[#171717] dark:text-[#f9fafb]">PROGRAMS</span>
          </Link>
          <div className="hidden sm:block max-w-xs w-full ml-2">
            <label className="sr-only" htmlFor="navbar-search">Search</label>
            <div className="relative">
              <input
                id="navbar-search"
                type="search"
                placeholder="Search Here"
                className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[var(--sidebar-bg)] dark:bg-[#1f2937] pl-3 pr-9 py-2 text-sm text-[#171717] dark:text-[#f9fafb] placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[var(--unipod-blue)]"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] dark:text-[#9ca3af]" aria-hidden>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center rounded-full border border-[var(--unipod-yellow)] bg-[var(--unipod-yellow-bg)] px-3 py-1 text-sm font-medium text-[#171717] dark:text-[#171717]">
            0 points
          </span>
          {/* Light / Dark mode toggle */}
          <div className="flex items-center rounded-full bg-[var(--unipod-blue-light)] dark:bg-[#1f2937] p-0.5 border border-[#e5e7eb] dark:border-[#374151]">
            <button
              type="button"
              onClick={() => { if (theme !== "light") toggleTheme(); }}
              className={`p-1.5 rounded-full ${theme === "light" ? "bg-white dark:bg-[#374151] shadow-sm" : "text-[#6b7280] dark:text-[#9ca3af]"}`}
              aria-label="Light mode"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { if (theme !== "dark") toggleTheme(); }}
              className={`p-1.5 rounded-full ${theme === "dark" ? "bg-[#374151] text-white shadow-sm" : "text-[#6b7280] dark:text-[#9ca3af]"}`}
              aria-label="Dark mode"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
          </div>
          <button type="button" className="relative p-2 text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#1f2937] rounded-lg" aria-label="Notifications">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button type="button" className="relative p-2 text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#1f2937] rounded-lg" aria-label="Messages">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">3</span>
          </button>
          <div className="relative flex items-center gap-2 pl-2 border-l border-[#e5e7eb] dark:border-[#374151]">
            <button
              type="button"
              onClick={() => setUserOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#1f2937]"
              aria-expanded={userOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--unipod-blue-light)] dark:bg-[#374151] flex items-center justify-center text-sm font-semibold text-[var(--unipod-blue)] dark:text-[#d1d5db]">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-[#171717] dark:text-[#f9fafb]">{user.name || "User"}</p>
                <p className="text-xs text-[#6b7280] dark:text-[#9ca3af]">{roleLabels[user.role]}</p>
              </div>
              <svg className="h-4 w-4 text-[#6b7280] dark:text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {userOpen && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setUserOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] shadow-lg py-1">
                  <Link href={`${base}/profile`} className="block px-4 py-2 text-sm text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]" onClick={() => setUserOpen(false)}>
                    Profile
                  </Link>
                  {(user.role === "MENTOR" || user.role === "ADMIN") && (
                    <Link href={`${base}/settings`} className="block px-4 py-2 text-sm text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]" onClick={() => setUserOpen(false)}>
                      Settings
                    </Link>
                  )}
                  <button type="button" onClick={() => { setUserOpen(false); signOut({ callbackUrl: "/" }); }} className="w-full text-left px-4 py-2 text-sm text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]">
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <aside
          className="w-56 flex-shrink-0 hidden md:flex flex-col bg-[var(--sidebar-bg)] dark:bg-[#1f2937] border-r border-[#e5e7eb] dark:border-[#374151] py-4"
        >
          <nav className="flex flex-col gap-0.5 px-2">
            {links.map((entry) => {
              if (isNavGroup(entry)) {
                return (
                  <div key={entry.group} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-[#6b7280] dark:text-[#9ca3af] uppercase tracking-wider">
                      <span className="text-[#6b7280] dark:text-[#9ca3af]">{icons[entry.icon]}</span>
                      {entry.group}
                    </div>
                    {entry.items.map((item) => {
                      const isActive = pathname === item.href || (item.href !== base && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-lg pl-6 pr-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-[var(--unipod-blue-light)] text-[var(--unipod-blue)] border-l-4 border-[var(--unipod-blue)] border-y-0 border-r-0"
                              : "text-[#374151] dark:text-[#d1d5db] hover:bg-white/80 dark:hover:bg-[#374151] hover:text-[#171717] dark:hover:text-[#f9fafb]"
                          }`}
                          style={
                            isActive
                              ? {
                                  backgroundColor: "var(--unipod-blue-light)",
                                  color: "var(--unipod-blue)",
                                  borderLeftColor: "var(--unipod-blue)",
                                }
                              : undefined
                          }
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                );
              }
              const { href, label, icon } = entry;
              const isActive = pathname === href || (href !== base && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--unipod-blue-light)] text-[var(--unipod-blue)] border-l-4 border-[var(--unipod-blue)] border-y-0 border-r-0"
                      : "text-[#374151] dark:text-[#d1d5db] hover:bg-white/80 dark:hover:bg-[#374151] hover:text-[#171717] dark:hover:text-[#f9fafb]"
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: "var(--unipod-blue-light)",
                          color: "var(--unipod-blue)",
                          borderLeftColor: "var(--unipod-blue)",
                        }
                      : undefined
                  }
                >
                  <span className={isActive ? "text-[var(--unipod-blue)]" : "text-[#6b7280] dark:text-[#9ca3af]"}>
                    {icons[icon]}
                  </span>
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto pt-4 border-t border-[#e5e7eb] px-2 space-y-0.5">
            <Link
              href={`${base}/profile`}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === `${base}/profile` ? "bg-[var(--unipod-blue-light)] text-[var(--unipod-blue)]" : "text-[#374151] hover:bg-white/80"
              }`}
            >
              {icons.user}
              Profile
            </Link>
            {user.role === "MENTOR" && (
              <Link
                href={`${base}/settings`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  pathname === `${base}/settings`
                    ? "bg-[var(--unipod-blue-light)] text-[var(--unipod-blue)]"
                    : "text-[#374151] hover:bg-white/80"
                }`}
              >
                {icons.cog}
                Settings
              </Link>
            )}
          </div>
        </aside>

        {/* Main content: fixed height, scroll only inside this area (never the whole page) */}
        <main className="flex-1 min-h-0 flex flex-col p-6 bg-white dark:bg-[#111827]">
          <div className="flex-1 min-h-0 flex flex-col overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
