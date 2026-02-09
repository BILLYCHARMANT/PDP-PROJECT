import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RegisterUserForm } from "@/components/admin/RegisterUserForm";

export default async function RegisterUserPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");
  return (
    <div>
      <Link
        href="/dashboard/admin/users"
        className="text-sm text-slate-600 hover:text-slate-900"
      >
        ← Users
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-4 mb-4">
        Register user
      </h1>
      <RegisterUserForm />
    </div>
  );
}
