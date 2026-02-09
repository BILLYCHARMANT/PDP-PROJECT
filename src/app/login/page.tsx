"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--sidebar-bg)]">
      <div className="w-full max-w-sm rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
        <div className="flex justify-center mb-6">
          <span className="text-2xl font-bold" style={{ color: "var(--unipod-blue)" }}>UNIPOD</span>
          <span className="text-2xl font-bold text-[#171717]"> PDP</span>
        </div>
        <h1 className="text-xl font-semibold text-[#171717] text-center mb-6">
          Sign in to PDP Dashboard
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[var(--unipod-blue)] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#374151] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[var(--unipod-blue)] focus:border-transparent"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-white font-medium rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[#6b7280]">
          <Link href="/" className="hover:underline" style={{ color: "var(--unipod-blue)" }}>
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
