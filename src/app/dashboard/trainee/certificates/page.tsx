import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CertificatesList } from "@/components/trainee/CertificatesList";

export default async function TraineeCertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TRAINEE") redirect("/dashboard");
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My certificates</h1>
      <CertificatesList />
    </div>
  );
}
