"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function ProgramForm({
  initial = {},
  programId,
  onSuccess,
}: {
  initial?: { name?: string; description?: string; imageUrl?: string | null; duration?: string | null };
  programId?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial.name ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? "");
  const [duration, setDuration] = useState(initial.duration ?? "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = programId
        ? `/api/programs/${programId}`
        : "/api/programs";
      const method = programId ? "PATCH" : "POST";
      const body = programId
        ? {
            name: name || undefined,
            description: description || undefined,
            imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
            duration: duration.trim() || undefined,
          }
        : {
            name,
            description: description || undefined,
            imageUrl: imageUrl.trim() || undefined,
            duration: duration.trim() || undefined,
          };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message || data.error || "Failed to save");
        setLoading(false);
        return;
      }
      // If onSuccess callback is provided, call it instead of redirecting (for modal usage)
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to programs management page after creating/updating
        if (!programId) {
          router.push("/dashboard/admin/programs-management");
        } else {
          router.push(`/dashboard/admin/programs-management/${programId}`);
        }
        router.refresh();
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-[#d1d5db] mb-1">
          Course image <span className="text-slate-500 dark:text-[#9ca3af]">(optional)</span>
        </label>
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                width={160}
                height={100}
                className="rounded-lg object-cover border border-slate-200 dark:border-[#374151] w-40 h-[100px]"
              />
            ) : (
              <div className="w-40 h-[100px] rounded-lg border-2 border-dashed border-slate-300 dark:border-[#374151] bg-slate-50 dark:bg-[#1f2937] flex items-center justify-center text-slate-400 dark:text-[#9ca3af] text-sm">
                No image
              </div>
            )}
          </div>
          <div className="min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !file.type.startsWith("image/")) {
                  setError("Please select an image (PNG, JPG, GIF, WebP).");
                  return;
                }
                setError("");
                setUploading(true);
                const formData = new FormData();
                formData.set("file", file);
                formData.set("type", "course");
                try {
                  const res = await fetch("/api/upload", { method: "POST", body: formData });
                  const data = await res.json().catch(() => ({}));
                  if (data?.fileUrl) setImageUrl(data.fileUrl);
                  else setError("Upload failed.");
                } catch {
                  setError("Upload failed.");
                }
                setUploading(false);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-slate-300 dark:border-[#374151] px-3 py-2 text-sm font-medium text-slate-700 dark:text-[#d1d5db] hover:bg-slate-50 dark:hover:bg-[#374151] disabled:opacity-50"
            >
              {uploading ? "Uploading…" : imageUrl ? "Change image" : "Upload image"}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-[#9ca3af] hover:bg-slate-100 dark:hover:bg-[#374151]"
              >
                Remove
              </button>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-[#9ca3af]">
              Used on course cards. PNG, JPG, GIF or WebP.
            </p>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Duration <span className="text-slate-500">(optional)</span>
        </label>
        <input
          type="text"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g. 6 Weeks, 7 Months"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg btn-unipod px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Saving…" : programId ? "Update" : "Create"}
      </button>
    </form>
  );
}
