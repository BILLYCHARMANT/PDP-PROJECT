"use client";
import { useEffect, useState } from "react";

type Cert = {
  id: string;
  certificateId: string;
  programId: string;
  program: { name: string };
  issuedAt: string;
  pdfUrl: string | null;
};

export function CertificatesList() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/certificates")
      .then((r) => r.json())
      .then((data) => {
        setCerts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <p className="text-slate-600">Loading…</p>;
  if (certs.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
        You have no certificates yet. Complete a program to receive your
        certificate.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {certs.map((c) => (
        <li
          key={c.id}
          className="rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between"
        >
          <div>
            <p className="font-medium text-slate-800">{c.program.name}</p>
            <p className="text-sm text-slate-500">
              {c.certificateId} ·{" "}
              {new Date(c.issuedAt).toLocaleDateString()}
            </p>
          </div>
          {c.pdfUrl && (
            <a
              href={c.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded btn-unipod px-3 py-1.5 text-sm"
            >
              Download PDF
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
