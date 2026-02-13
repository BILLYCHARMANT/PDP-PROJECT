"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function VerifyCert() {
  const searchParams = useSearchParams();
  const certId = searchParams.get("cert");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (!certId) {
      setResult({ valid: false, error: "No certificate ID provided" });
      return;
    }
    fetch("/api/verify?cert=" + encodeURIComponent(certId))
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult({ valid: false, error: "Verification failed" }));
  }, [certId]);
  if (result === null) return <p className="text-slate-500">Verifying…</p>;
  const valid = result.valid as boolean;
  if (!valid) {
    return (
      <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3">
        {(result.error as string) || "Certificate not found or invalid."}
      </p>
    );
  }
  return (
    <div className="rounded-lg bg-green-50 p-4 text-green-800 space-y-1">
      <p className="font-semibold">Valid certificate</p>
      <p><strong>{String(result.traineeName ?? "")}</strong></p>
      <p>{String(result.programName ?? "")}</p>
      {result.issuedAt != null ? (
        <p className="text-sm">Issued: {new Date(String(result.issuedAt)).toLocaleDateString()}</p>
      ) : null}
      <p className="text-xs text-slate-500">ID: {String(result.certificateId ?? "")}</p>
    </div>
  );
}
