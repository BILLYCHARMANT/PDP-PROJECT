import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-bold">
          <span style={{ color: "var(--unipod-blue)" }}>UNIPOD</span>
          <span className="text-[#171717]"> PDP</span>
        </h1>
        <p className="text-[#374151]">
          Prototyping Development Program — learning, progress tracking, and
          <span className="font-medium px-1" style={{ color: "var(--unipod-yellow)", backgroundColor: "var(--unipod-yellow-bg)" }}>certification</span>.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
