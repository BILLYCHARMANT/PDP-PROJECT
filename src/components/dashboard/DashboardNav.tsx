"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  MENTOR: "Mentor",
  TRAINEE: "Trainee",
};

export function DashboardNav({
  user,
}: {
  user: { name?: string | null; email?: string | null; role: Role };
}) {
  const pathname = usePathname();
  const base = "/dashboard";

  const adminLinks = [
    { href: base, label: "Overview" },
    { href: `${base}/admin/programs`, label: "Programs" },
    { href: `${base}/admin/cohorts`, label: "Cohorts" },
    { href: `${base}/admin/users`, label: "Users" },
    { href: `${base}/admin/analytics`, label: "Analytics" },
  ];
  const mentorLinks = [
    { href: base, label: "Overview" },
    { href: `${base}/mentor/submissions`, label: "Submissions" },
  ];
  const traineeLinks = [
    { href: base, label: "My progress" },
    { href: `${base}/trainee/learn`, label: "Learning" },
    { href: `${base}/trainee/certificates`, label: "Certificates" },
  ];

  const links =
    user.role === "ADMIN"
      ? adminLinks
      : user.role === "MENTOR"
        ? mentorLinks
        : traineeLinks;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href={base} className="font-semibold text-slate-800">
            UNIPOD PDP
          </Link>
          <nav className="flex gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === href
                    ? "bg-[var(--unipod-blue-light)] text-[var(--unipod-blue)]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            {user.name} ({roleLabels[user.role]})
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
