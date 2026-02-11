import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");

  // Don't redirect on no enrollments - let the page show empty state
  return <>{children}</>;
}
