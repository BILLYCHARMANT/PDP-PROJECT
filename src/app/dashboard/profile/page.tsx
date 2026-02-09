import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return (
    <div
      className="min-h-full rounded-xl p-6 max-w-xl"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Profile</h1>
      <p className="mt-1 text-sm text-[#6b7280] dark:text-[#9ca3af]">
        Set up your profile. You can update your name and upload a profile image.
      </p>
      <ProfileForm />
    </div>
  );
}
