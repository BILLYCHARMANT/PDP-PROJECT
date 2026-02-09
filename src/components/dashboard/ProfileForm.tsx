"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

export function ProfileForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.name) setName(data.name);
        if (data?.email) setEmail(data.email);
        if (data?.imageUrl) setImageUrl(data.imageUrl);
        if (data?.phone != null) setPhone(data.phone ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, GIF).");
      return;
    }
    setError("");
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("type", "avatar");
    fetch("/api/upload", { method: "POST", body: formData })
      .then((r) => r.json())
      .then((data) => {
        if (data?.fileUrl) {
          setImageUrl(data.fileUrl);
          saveProfile({ imageUrl: data.fileUrl });
        } else setError("Upload failed.");
        setUploading(false);
      })
      .catch(() => {
        setError("Upload failed.");
        setUploading(false);
      });
  };

  const saveProfile = (overrides?: { name?: string; imageUrl?: string | null; phone?: string | null }) => {
    setSaving(true);
    setError("");
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: overrides?.name ?? name,
        imageUrl: overrides?.imageUrl !== undefined ? overrides.imageUrl : imageUrl,
        phone: overrides?.phone !== undefined ? overrides.phone : (phone || null),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.name) setName(data.name);
        if (data?.imageUrl !== undefined) setImageUrl(data.imageUrl);
        if (data?.phone !== undefined) setPhone(data.phone ?? "");
        setSaving(false);
      })
      .catch(() => {
        setError("Failed to save.");
        setSaving(false);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile();
  };

  if (loading) return <p className="text-[#6b7280] mt-4">Loading…</p>;

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-5">
        <h2 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-3">Profile image</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            {imageUrl ? (
              <Image
                src={imageUrl.startsWith("/") ? imageUrl : imageUrl}
                alt=""
                width={80}
                height={80}
                className="rounded-full object-cover border-2 border-[#e5e7eb] dark:border-[#374151]"
                unoptimized={imageUrl.startsWith("/api/")}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[var(--unipod-blue-light)] dark:bg-[#374151] flex items-center justify-center text-2xl font-semibold" style={{ color: "var(--unipod-blue)" }}>
                {(name || "U").slice(0, 2).toUpperCase()}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg px-3 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151] disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload image"}
            </button>
            <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1">PNG, JPG or GIF. This will appear on your user card.</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-5">
        <h2 className="text-sm font-semibold text-[#171717] dark:text-[#f9fafb] mb-3">Details</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Email</label>
            <input type="text" value={email} readOnly className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[var(--sidebar-bg)] dark:bg-[#374151] px-3 py-2 text-[#6b7280] dark:text-[#9ca3af]" />
            <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-0.5">Email cannot be changed here. Contact an admin if needed.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Phone (Rwanda)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+250 78X XXX XXX"
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
            />
            <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-0.5">Optional. Rwandan format, e.g. +250 788 123 456.</p>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--unipod-blue)" }}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
