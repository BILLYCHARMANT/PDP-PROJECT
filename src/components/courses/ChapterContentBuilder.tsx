"use client";

import { useState, useRef, useEffect } from "react";

// Image Upload Block Component with Drag and Drop
function ImageUploadBlock({
  block,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  block: ContentBlock & { type: "image" };
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file);
    } else {
      setError("Please drop an image file (PNG, JPG, GIF, WebP)");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file);
    } else {
      setError("Please select an image file (PNG, JPG, GIF, WebP)");
    }
  }

  async function handleFileUpload(file: File) {
    setError("");
    setUploading(true);
    
    const formData = new FormData();
    formData.set("file", file);
    formData.set("type", "course");
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        setError(data.error || "Failed to upload image");
        setUploading(false);
        return;
      }
      
      onUpdate({ url: data.fileUrl });
      setUploading(false);
    } catch (err) {
      setError("Network error. Please try again.");
      setUploading(false);
    }
  }

  function handleRemove() {
    onUpdate({ url: "", alt: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="group relative border border-[#e5e7eb] dark:border-[#374151] rounded-lg p-3 bg-white dark:bg-[#1f2937]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">Image</span>
        <div className="flex-1" />
        <button type="button" onClick={onMoveUp} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↑</button>
        <button type="button" onClick={onMoveDown} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↓</button>
        <button type="button" onClick={onDelete} className="text-xs text-red-600 hover:text-red-700">✕</button>
      </div>
      <div className="space-y-2">
        {!block.url ? (
          <div
            ref={dropZoneRef}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? "border-[var(--unipod-blue)] bg-blue-50 dark:bg-blue-900/20"
                : "border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id={`image-upload-${block.id}`}
            />
            {uploading ? (
              <div className="space-y-2">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--unipod-blue)]"></div>
                <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Uploading image...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-[#9ca3af] dark:text-[#6b7280]"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <label
                    htmlFor={`image-upload-${block.id}`}
                    className="cursor-pointer text-sm font-medium text-[var(--unipod-blue)] hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Click to upload
                  </label>
                  <span className="text-sm text-[#6b7280] dark:text-[#9ca3af]"> or drag and drop</span>
                </div>
                <p className="text-xs text-[#9ca3af] dark:text-[#6b7280]">PNG, JPG, GIF, WebP up to 10MB</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.url}
                alt={block.alt || ""}
                className="max-w-full h-auto max-h-64 rounded border border-[#e5e7eb] dark:border-[#374151]"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 text-xs"
                title="Remove image"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={block.alt || ""}
              onChange={(e) => onUpdate({ alt: e.target.value })}
              placeholder="Alt text (optional)"
              className="w-full rounded border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
              style={{ color: "inherit", direction: "ltr", textAlign: "left" }}
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => {
                handleRemove();
                fileInputRef.current?.click();
              }}
              className="text-xs text-[var(--unipod-blue)] hover:underline"
            >
              Replace image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}

// Video Upload Block: URL or file upload (drag and drop)
const VIDEO_ACCEPT = "video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov";

function VideoUploadBlock({
  block,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  block: ContentBlock & { type: "video" };
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      handleFileUpload(file);
    } else {
      setError("Please drop a video file (MP4, WebM, MOV, OGG)");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      handleFileUpload(file);
    } else {
      setError("Please select a video file (MP4, WebM, MOV, OGG)");
    }
  }

  async function handleFileUpload(file: File) {
    setError("");
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("type", "course");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to upload video");
        setUploading(false);
        return;
      }
      onUpdate({ url: data.fileUrl, fileName: data.filename || file.name });
      setUploading(false);
    } catch (err) {
      setError("Network error. Please try again.");
      setUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const isUploadedVideo = block.url?.startsWith("/api/upload/serve/");

  return (
    <div className="group relative border-2 border-dashed border-purple-500 rounded-lg p-3 bg-purple-50 dark:bg-purple-900/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Video</span>
        <div className="flex-1" />
        <button type="button" onClick={onMoveUp} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↑</button>
        <button type="button" onClick={onMoveDown} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↓</button>
        <button type="button" onClick={onDelete} className="text-xs text-red-600 hover:text-red-700">✕</button>
      </div>
      <div className="space-y-2">
        <input
          type="text"
          value={block.title || ""}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Video Title (optional)"
          className="w-full rounded border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
          style={{ color: "inherit", direction: "ltr", textAlign: "left" }}
          dir="ltr"
        />

        {/* Video URL (for YouTube, Vimeo, etc.) */}
        <input
          type="url"
          value={isUploadedVideo ? "" : block.url}
          onChange={(e) => onUpdate({ url: e.target.value, fileName: undefined })}
          placeholder="Or paste video URL (YouTube, Vimeo, etc.)"
          className="w-full rounded border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
          style={{ color: "inherit", direction: "ltr", textAlign: "left" }}
          dir="ltr"
        />

        {/* Upload zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragActive ? "border-purple-500 bg-purple-100 dark:bg-purple-900/30" : "border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={VIDEO_ACCEPT}
            onChange={handleFileSelect}
            className="hidden"
            id={`video-upload-${block.id}`}
          />
          {uploading ? (
            <div className="space-y-2">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">Uploading video...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="mx-auto h-10 w-10 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div>
                <label
                  htmlFor={`video-upload-${block.id}`}
                  className="cursor-pointer text-sm font-medium text-purple-700 dark:text-purple-300 hover:underline"
                >
                  Click to upload video
                </label>
                <span className="text-sm text-[#6b7280] dark:text-[#9ca3af]"> or drag and drop</span>
              </div>
              <p className="text-xs text-[#9ca3af] dark:text-[#6b7280]">MP4, WebM, MOV, OGG</p>
            </div>
          )}
        </div>

        {block.url && (
          <div className="mt-2 p-2 bg-white dark:bg-[#1f2937] rounded border border-[#e5e7eb] dark:border-[#374151]">
            <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mb-1">Preview:</p>
            <div className="aspect-video bg-black rounded overflow-hidden flex items-center justify-center">
              {isUploadedVideo ? (
                <video
                  src={block.url}
                  controls
                  className="max-w-full max-h-full"
                  title={block.title || block.fileName || "Video"}
                />
              ) : (
                <span className="text-white text-xs">External: {block.title || block.url}</span>
              )}
            </div>
            {block.url && (
              <button
                type="button"
                onClick={() => onUpdate({ url: "", fileName: undefined })}
                className="mt-2 text-xs text-red-600 hover:text-red-700"
              >
                Remove video
              </button>
            )}
          </div>
        )}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}

export type ContentBlock = 
  | { type: "title"; content: string; id: string }
  | { type: "header"; content: string; level: 1 | 2 | 3; id: string }
  | { type: "paragraph"; content: string; htmlContent?: string; id: string } // htmlContent for rich text formatting
  | { type: "quiz"; quizId: string | null; title: string; content: string; htmlContent?: string; quizNumber: number; id: string }
  | { type: "assignment"; assignmentId: string | null; title: string; content: string; htmlContent?: string; fileUrl?: string; fileName?: string; id: string }
  | { type: "image"; url: string; alt?: string; id: string }
  | { type: "video"; url: string; title?: string; fileName?: string; id: string }
  | { type: "link"; url: string; text: string; id: string };

// Rich Text Editor Component for inline formatting (select text to format)
function RichTextEditor({
  block,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
  label,
  showControls = true,
}: {
  block: { content: string; htmlContent?: string };
  onUpdate: (updates: { content?: string; htmlContent?: string }) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  label: string;
  showControls?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");

  // --- FIX 1: Prevent Re-render Loop ---
  useEffect(() => {
    if (editorRef.current) {
      const currentHTML = editorRef.current.innerHTML;
      const incomingHTML = block.htmlContent || "";
      
      // ONLY update the DOM if the incoming prop is different from current DOM.
      // This prevents the cursor from resetting to position 0 while typing.
      if (incomingHTML !== currentHTML) {
        editorRef.current.innerHTML = incomingHTML;
      }
      
      // Fallback for plain text content if HTML is missing
      if (!block.htmlContent && block.content && editorRef.current.textContent !== block.content) {
         editorRef.current.textContent = block.content;
      }
    }
  }, [block.htmlContent, block.content]);

  function handleInput() {
    if (!editorRef.current) return;
    
    // Get content
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.textContent || "";
    
    // Simply pass data up. We do NOT need to manage cursor here 
    // because we stopped the useEffect from nuking the DOM above.
    onUpdate({ content: text, htmlContent: html });
  }

  function applyFormat(command: string, value?: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleInput();
  }

  return (
    <div 
      className="group relative border border-[#e5e7eb] dark:border-[#374151] rounded-lg p-3 bg-white dark:bg-[#1f2937]"
      // --- FIX 2: Handle Direction via CSS only ---
      // We don't need JS to force this on every keystroke. 
      // CSS is powerful enough and doesn't mess with the cursor.
      dir="ltr"
      style={{ direction: "ltr", textAlign: "left" }}
    >
      {showControls && (
        <div className="flex items-center gap-2 mb-2">
          {label && <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">{label}</span>}
          <div className="flex gap-1">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyFormat("bold"); }}
              className="text-xs px-2 py-0.5 rounded bg-[#e5e7eb] dark:bg-[#374151] text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--unipod-blue)] hover:text-white font-bold"
            >
              B
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyFormat("italic"); }}
              className="text-xs px-2 py-0.5 rounded bg-[#e5e7eb] dark:bg-[#374151] text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--unipod-blue)] hover:text-white italic"
            >
              I
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyFormat("underline"); }}
              className="text-xs px-2 py-0.5 rounded bg-[#e5e7eb] dark:bg-[#374151] text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--unipod-blue)] hover:text-white underline"
            >
              U
            </button>
            
            <div className="flex items-center gap-1 border-l border-[#e5e7eb] dark:border-[#374151] pl-1 ml-1">
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  applyFormat("foreColor", e.target.value);
                }}
                className="w-6 h-6 rounded border border-[#e5e7eb] dark:border-[#374151] cursor-pointer"
                title="Text Color"
              />
              <input
                type="color"
                value={bgColor}
                onChange={(e) => {
                  setBgColor(e.target.value);
                  applyFormat("backColor", e.target.value);
                }}
                className="w-6 h-6 rounded border border-[#e5e7eb] dark:border-[#374151] cursor-pointer"
                title="Background Color"
              />
            </div>
          </div>
          <div className="flex-1" />
          <button type="button" onClick={onMoveUp} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↑</button>
          <button type="button" onClick={onMoveDown} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↓</button>
          <button type="button" onClick={onDelete} className="text-xs text-red-600 hover:text-red-700">✕</button>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        // Removed aggressive LTR enforcers on composition/focus
        // as they trigger unnecessary DOM mutations
        spellCheck={false}
        className="min-h-[80px] w-full rounded border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb] focus:outline-none focus:ring-1 focus:ring-[var(--unipod-blue)]"
        style={{ 
          whiteSpace: "pre-wrap", 
          color: "inherit", 
          direction: "ltr", 
          textAlign: "left",
          unicodeBidi: "isolate" // 'isolate' is often safer than 'embed' for containers
        }}
        data-placeholder="Type your content here..."
        suppressContentEditableWarning
      />
      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

export function ChapterContentBuilder({
  content,
  onChange,
  availableQuizzes = [],
  availableAssignments = [],
}: {
  content: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  availableQuizzes?: Array<{ id: string; title: string }>;
  availableAssignments?: Array<{ id: string; title: string }>;
}) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  // Get next quiz number
  function getNextQuizNumber(): number {
    const quizBlocks = content.filter(b => b.type === "quiz") as Array<ContentBlock & { type: "quiz" }>;
    if (quizBlocks.length === 0) return 1;
    const maxNumber = Math.max(...quizBlocks.map(q => q.quizNumber || 0));
    return maxNumber + 1;
  }

  function addBlock(type: ContentBlock["type"]) {
    const newBlock = (() => {
      switch (type) {
        case "title":
          return { type: "title" as const, content: "", id: `block-${Date.now()}` };
        case "header":
          return { type: "header" as const, content: "", level: 1 as const, id: `block-${Date.now()}` };
        case "paragraph":
          return { type: "paragraph", content: "", htmlContent: "", id: `block-${Date.now()}` };
        case "quiz":
          return { type: "quiz", quizId: null, title: `Quiz ${getNextQuizNumber()}`, content: "", htmlContent: "", quizNumber: getNextQuizNumber(), id: `block-${Date.now()}` };
        case "assignment":
          return { type: "assignment", assignmentId: null, title: "", content: "", htmlContent: "", fileUrl: undefined, fileName: undefined, id: `block-${Date.now()}` };
        case "image":
          return { type: "image", url: "", id: `block-${Date.now()}` };
        case "video":
          return { type: "video", url: "", title: "", fileName: undefined, id: `block-${Date.now()}` };
        case "link":
          return { type: "link", url: "", text: "", id: `block-${Date.now()}` };
      }
    })() as ContentBlock;
    const nextContent: ContentBlock[] = [...content, newBlock] as ContentBlock[];
    onChange(nextContent);
    setEditingBlockId(newBlock.id);
  }

  function updateBlock(id: string, updates: Partial<ContentBlock>) {
    onChange(content.map(block => block.id === id ? { ...block, ...updates } : block) as ContentBlock[]);
  }

  function deleteBlock(id: string) {
    onChange(content.filter(block => block.id !== id));
  }

  function moveBlock(id: string, direction: "up" | "down") {
    const index = content.findIndex(b => b.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === content.length - 1) return;
    
    const newContent = [...content];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newContent[index], newContent[targetIndex]] = [newContent[targetIndex], newContent[index]];
    onChange(newContent);
  }

  function renderBlock(block: ContentBlock) {
    const isEditing = editingBlockId === block.id;

    switch (block.type) {
      case "title":
        return (
          <div key={block.id} className="group relative border border-[#e5e7eb] dark:border-[#374151] rounded-lg p-3 bg-white dark:bg-[#1f2937]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">Title</span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => moveBlock(block.id, "up")}
                className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveBlock(block.id, "down")}
                className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => deleteBlock(block.id)}
                className="text-xs text-red-600 hover:text-red-700"
                title="Delete"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Chapter Title"
              className="w-full text-xl font-bold text-[#171717] dark:text-[#f9fafb] bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[var(--unipod-blue)] rounded px-2 py-1 placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
              style={{ color: "inherit", direction: "ltr", textAlign: "left" }}
              dir="ltr"
            />
          </div>
        );

      case "header":
        return (
          <div key={block.id} className="group relative border border-[#e5e7eb] dark:border-[#374151] rounded-lg p-3 bg-white dark:bg-[#1f2937]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">Header {block.level}</span>
              <select
                value={block.level}
                onChange={(e) => updateBlock(block.id, { level: Number(e.target.value) as 1 | 2 | 3 })}
                className="text-xs border border-[#e5e7eb] dark:border-[#374151] rounded px-1 py-0.5"
              >
                <option value={1}>H1</option>
                <option value={2}>H2</option>
                <option value={3}>H3</option>
              </select>
              <div className="flex-1" />
              <button type="button" onClick={() => moveBlock(block.id, "up")} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↑</button>
              <button type="button" onClick={() => moveBlock(block.id, "down")} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↓</button>
              <button type="button" onClick={() => deleteBlock(block.id)} className="text-xs text-red-600 hover:text-red-700">✕</button>
            </div>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder={`Header ${block.level}`}
              className={`w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[var(--unipod-blue)] rounded px-2 py-1 ${
                block.level === 1 ? "text-lg font-semibold" : block.level === 2 ? "text-base font-medium" : "text-sm font-medium"
              } text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]`}
              style={{ color: "inherit", direction: "ltr", textAlign: "left" }}
              dir="ltr"
            />
          </div>
        );

      case "paragraph":
        return (
          <RichTextEditor
            key={block.id}
            block={block}
            onUpdate={(updates) => updateBlock(block.id, updates)}
            onMoveUp={() => moveBlock(block.id, "up")}
            onMoveDown={() => moveBlock(block.id, "down")}
            onDelete={() => deleteBlock(block.id)}
            label="Paragraph"
          />
        );

      case "quiz":
        return (
          <div key={block.id} className="group relative border-2 border-dashed border-[var(--unipod-blue)] rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-[var(--unipod-blue)]">Quiz {block.quizNumber}</span>
              <div className="flex-1" />
              <button type="button" onClick={() => moveBlock(block.id, "up")} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↑</button>
              <button type="button" onClick={() => moveBlock(block.id, "down")} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↓</button>
              <button type="button" onClick={() => deleteBlock(block.id)} className="text-xs text-red-600 hover:text-red-700">✕</button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={block.title}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                placeholder="Quiz Title"
                className="w-full rounded border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
                dir="ltr"
                style={{ color: "inherit", direction: "ltr", textAlign: "left" }}
              />
              {availableQuizzes.length > 0 && (
                <select
                  value={block.quizId || ""}
                  onChange={(e) => updateBlock(block.id, { quizId: e.target.value || null })}
                  className="w-full rounded border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1 text-sm text-[#171717] dark:text-[#f9fafb]"
                  style={{ color: "inherit" }}
                >
                  <option value="">-- Select existing quiz --</option>
                  {availableQuizzes.map(q => (
                    <option key={q.id} value={q.id}>{q.title}</option>
                  ))}
                </select>
              )}
              <div className="mt-2">
                <label className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Quiz Content</label>
                <RichTextEditor
                  block={{ content: block.content || "", htmlContent: block.htmlContent || "" }}
                  onUpdate={(updates) => updateBlock(block.id, { content: updates.content || block.content, htmlContent: updates.htmlContent || block.htmlContent })}
                  onMoveUp={() => {}}
                  onMoveDown={() => {}}
                  onDelete={() => {}}
                  label=""
                  showControls={true}
                />
              </div>
            </div>
          </div>
        );

      case "assignment":
        return (
          <div key={block.id} className="group relative border-2 border-dashed border-green-500 rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-green-700 dark:text-green-300">Assignment</span>
              <div className="flex-1" />
              <button type="button" onClick={() => moveBlock(block.id, "up")} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↑</button>
              <button type="button" onClick={() => moveBlock(block.id, "down")} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↓</button>
              <button type="button" onClick={() => deleteBlock(block.id)} className="text-xs text-red-600 hover:text-red-700">✕</button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={block.title}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                placeholder="Assignment Title"
                className="w-full rounded border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
                dir="ltr"
                style={{ color: "inherit", direction: "ltr", textAlign: "left" }}
              />
              {availableAssignments.length > 0 && (
                <select
                  value={block.assignmentId || ""}
                  onChange={(e) => updateBlock(block.id, { assignmentId: e.target.value || null })}
                  className="w-full rounded border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1 text-sm text-[#171717] dark:text-[#f9fafb]"
                  style={{ color: "inherit" }}
                >
                  <option value="">-- Select existing assignment --</option>
                  {availableAssignments.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              )}
              <div className="mt-2">
                <label className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Assignment Content</label>
                <RichTextEditor
                  block={{ content: block.content || "", htmlContent: block.htmlContent || "" }}
                  onUpdate={(updates) => updateBlock(block.id, { content: updates.content || block.content, htmlContent: updates.htmlContent || block.htmlContent })}
                  onMoveUp={() => {}}
                  onMoveDown={() => {}}
                  onDelete={() => {}}
                  label=""
                  showControls={true}
                />
              </div>
              <div className="mt-2">
                <label className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Attach Document (Optional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // In a real implementation, you'd upload the file first
                        // For now, we'll store the file name and create a placeholder URL
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          updateBlock(block.id, { 
                            fileUrl: reader.result as string, 
                            fileName: file.name 
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    id={`assignment-file-${block.id}`}
                  />
                  <label
                    htmlFor={`assignment-file-${block.id}`}
                    className="flex-1 cursor-pointer rounded border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1 text-sm text-[#171717] dark:text-[#f9fafb] hover:bg-[#f9fafb] dark:hover:bg-[#111827]"
                  >
                    {block.fileName ? `📎 ${block.fileName}` : "📎 Choose file..."}
                  </label>
                  {block.fileName && (
                    <button
                      type="button"
                      onClick={() => updateBlock(block.id, { fileUrl: undefined, fileName: undefined })}
                      className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-1">
                  {block.assignmentId ? "Linked to existing assignment" : "Create new assignment or link to existing"}
                </p>
              </div>
            </div>
          </div>
        );

      case "image":
        return (
          <ImageUploadBlock
            key={block.id}
            block={block}
            onUpdate={(updates) => updateBlock(block.id, updates)}
            onMoveUp={() => moveBlock(block.id, "up")}
            onMoveDown={() => moveBlock(block.id, "down")}
            onDelete={() => deleteBlock(block.id)}
          />
        );

      case "video":
        return (
          <VideoUploadBlock
            key={block.id}
            block={block}
            onUpdate={(updates) => updateBlock(block.id, updates)}
            onMoveUp={() => moveBlock(block.id, "up")}
            onMoveDown={() => moveBlock(block.id, "down")}
            onDelete={() => deleteBlock(block.id)}
          />
        );

      case "link":
        return (
          <div key={block.id} className="group relative border border-[#e5e7eb] dark:border-[#374151] rounded-lg p-3 bg-white dark:bg-[#1f2937]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">Link</span>
              <div className="flex-1" />
              <button type="button" onClick={() => moveBlock(block.id, "up")} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↑</button>
              <button type="button" onClick={() => moveBlock(block.id, "down")} className="text-xs text-[#6b7280] hover:text-[#171717] dark:hover:text-[#f9fafb]">↓</button>
              <button type="button" onClick={() => deleteBlock(block.id)} className="text-xs text-red-600 hover:text-red-700">✕</button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={block.text}
                onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                placeholder="Link text"
                className="w-full rounded border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
                style={{ color: "inherit", direction: "ltr", textAlign: "left" }}
                dir="ltr"
              />
              <input
                type="url"
                value={block.url}
                onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                placeholder="URL"
                className="w-full rounded border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
                style={{ color: "inherit", direction: "ltr", textAlign: "left" }}
                dir="ltr"
              />
            </div>
          </div>
        );
    }
  }

  return (
    <div className="space-y-3">
      {content.map(block => renderBlock(block))}
      
      {/* Add Block Menu */}
      <div className="border-2 border-dashed border-[#e5e7eb] dark:border-[#374151] rounded-lg p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addBlock("title")}
            className="px-3 py-1.5 text-xs font-medium border border-[#e5e7eb] dark:border-[#374151] rounded hover:bg-[#f9fafb] dark:hover:bg-[#111827] text-[#374151] dark:text-[#d1d5db]"
          >
            + Title
          </button>
          <button
            type="button"
            onClick={() => addBlock("header")}
            className="px-3 py-1.5 text-xs font-medium border border-[#e5e7eb] dark:border-[#374151] rounded hover:bg-[#f9fafb] dark:hover:bg-[#111827] text-[#374151] dark:text-[#d1d5db]"
          >
            + Header
          </button>
          <button
            type="button"
            onClick={() => addBlock("paragraph")}
            className="px-3 py-1.5 text-xs font-medium border border-[#e5e7eb] dark:border-[#374151] rounded hover:bg-[#f9fafb] dark:hover:bg-[#111827] text-[#374151] dark:text-[#d1d5db]"
          >
            + Paragraph
          </button>
          <button
            type="button"
            onClick={() => addBlock("quiz")}
            className="px-3 py-1.5 text-xs font-medium border border-[var(--unipod-blue)] text-[var(--unipod-blue)] rounded hover:bg-[var(--unipod-blue-light)]"
          >
            + Quiz
          </button>
          <button
            type="button"
            onClick={() => addBlock("assignment")}
            className="px-3 py-1.5 text-xs font-medium border border-green-500 text-green-700 dark:text-green-300 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            + Assignment
          </button>
          <button
            type="button"
            onClick={() => addBlock("image")}
            className="px-3 py-1.5 text-xs font-medium border border-[#e5e7eb] dark:border-[#374151] rounded hover:bg-[#f9fafb] dark:hover:bg-[#111827] text-[#374151] dark:text-[#d1d5db]"
          >
            + Image
          </button>
          <button
            type="button"
            onClick={() => addBlock("video")}
            className="px-3 py-1.5 text-xs font-medium border border-purple-500 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            + Video
          </button>
          <button
            type="button"
            onClick={() => addBlock("link")}
            className="px-3 py-1.5 text-xs font-medium border border-[#e5e7eb] dark:border-[#374151] rounded hover:bg-[#f9fafb] dark:hover:bg-[#111827] text-[#374151] dark:text-[#d1d5db]"
          >
            + Link
          </button>
        </div>
      </div>
    </div>
  );
}
