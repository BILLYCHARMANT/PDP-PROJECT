import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  // Settings available to mentor (and optionally admin/trainee later)
  if (session.user.role !== "MENTOR" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div
      className="min-h-full rounded-xl p-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#171717]">Settings</h1>
        <p className="mt-1 text-[#6b7280]">
          Manage your account and preferences.
        </p>
      </div>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#171717]">Account</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Signed in as <strong>{session.user.email}</strong>. Account changes (e.g. password) are managed by your administrator.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#171717]">Notifications</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Notification preferences can be extended here (e.g. email when new submissions need review).
          </p>
        </div>
      </div>
    </div>
  );
}
