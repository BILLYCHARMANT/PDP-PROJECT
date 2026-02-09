import { Suspense } from "react";
import { VerifyCert } from "@/components/verify/VerifyCert";

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-800 text-center mb-6">
          Verify certificate
        </h1>
        <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
          <VerifyCert />
        </Suspense>
      </div>
    </div>
  );
}
