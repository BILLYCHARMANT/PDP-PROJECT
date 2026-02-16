"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function CreateProgramModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          imageUrl: imageUrl.trim() || undefined,
          duration: duration.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message || data.error || "Failed to create program");
        setLoading(false);
        return;
      }
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
      // Close modal and reset form
      onClose();
      setName("");
      setDescription("");
      setImageUrl("");
      setDuration("");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="rounded-2xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] dark:border-[#374151]">
          <h2 className="text-xl font-bold text-[#171717] dark:text-[#f9fafb]">Create New Program</h2>
          <button
            onClick={onClose}
            className="text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#f9fafb] p-1 rounded transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">
                Program Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
                placeholder="e.g. PROGRAMS, Data Science, Web Development"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">
                Description <span className="text-[#6b7280]">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
                placeholder="What this program covers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">
                Program Image <span className="text-[#6b7280]">(optional)</span>
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
                      className="rounded-lg object-cover border border-[#e5e7eb] dark:border-[#374151] w-40 h-[100px]"
                    />
                  ) : (
                    <div className="w-40 h-[100px] rounded-lg border-2 border-dashed border-[#e5e7eb] dark:border-[#374151] bg-[var(--sidebar-bg)] dark:bg-[#1f2937] flex items-center justify-center text-[#6b7280] dark:text-[#9ca3af] text-sm">
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
                      formData.set("type", "program");
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
                    className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-3 py-2 text-sm font-medium text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151] disabled:opacity-50"
                  >
                    {uploading ? "Uploading…" : imageUrl ? "Change image" : "Upload image"}
                  </button>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-[#6b7280] dark:text-[#9ca3af] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]"
                    >
                      Remove
                    </button>
                  )}
                  <p className="mt-1 text-xs text-[#6b7280] dark:text-[#9ca3af]">
                    PNG, JPG, GIF or WebP. Used on program cards.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">
                Duration <span className="text-[#6b7280]">(optional)</span>
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 12 weeks, 6 months"
                className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-4 py-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "var(--unipod-blue)" }}
              >
                {loading ? "Creating…" : "Create Program"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
