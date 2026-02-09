import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsView } from "@/components/admin/AnalyticsView";

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Analytics</h1>
      <AnalyticsView />
    </div>
  );
}
