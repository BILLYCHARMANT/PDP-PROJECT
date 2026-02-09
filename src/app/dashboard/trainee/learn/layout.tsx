import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");

  const enrollmentCount = await prisma.enrollment.count({
    where: { traineeId: session.user.id },
  });
  if (enrollmentCount === 0) redirect("/dashboard");

  return <>{children}</>;
}
