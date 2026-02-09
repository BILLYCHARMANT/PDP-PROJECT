"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useMemo } from "react";

type Lesson = {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  resourceUrl: string | null;
};

function splitContentIntoPages(content: string | null): string[] {
  if (!content || !content.trim()) return [];
  const sections = content
    .split(/\n---\n|\n\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sections.length > 0 ? sections : [content.trim()];
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp)(\?.*)?$/i;
function isImageUrl(line: string): boolean {
  const t = line.trim();
  return (t.startsWith("http://") || t.startsWith("https://")) && IMAGE_EXT.test(t);
}

function ContentBlock({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let paragraph: string[] = [];

  function flushParagraph(key: number) {
    if (paragraph.length > 0) {
      nodes.push(
        <p key={key} className="text-[17px] leading-[1.75] text-[#374151]">
          {paragraph.join(" ")}
        </p>
      );
      paragraph = [];
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (isImageUrl(trimmed)) {
      flushParagraph(i * 2);
      nodes.push(
        <figure key={i * 2 + 1} className="my-6 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#fafafa] shadow-sm">
          <img
            src={trimmed}
            alt=""
            className="w-full max-h-[400px] object-contain object-center"
          />
        </figure>
      );
    } else if (trimmed) {
      paragraph.push(trimmed);
    } else {
      flushParagraph(i * 2);
    }
  });
  flushParagraph(lines.length * 2);

  return <div className="space-y-4">{nodes}</div>;
}

export function LessonViewContent({
  lesson,
  programId,
  moduleId,
  programName,
  alreadyCompleted,
  prevLessonId,
  nextLessonId,
}: {
  lesson: Lesson;
  programId: string;
  moduleId: string;
  programName: string;
  alreadyCompleted: boolean;
  prevLessonId: string | null;
  nextLessonId: string | null;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [marking, setMarking] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const pages = useMemo(() => splitContentIntoPages(lesson.content), [lesson.content]);
  const hasVideo = !!lesson.videoUrl;
  const hasResource = !!lesson.resourceUrl;
  const totalPages = pages.length + (hasVideo ? 1 : 0) + (hasResource ? 1 : 0);
  const actualLastPageIndex = totalPages > 0 ? totalPages - 1 : 0;
  const isContentPage = currentPage < pages.length;
  const isVideoPage = hasVideo && currentPage === pages.length;
  const isResourcePage = hasResource && currentPage === pages.length + (hasVideo ? 1 : 0);
  const showMarkComplete = totalPages === 0 || currentPage >= actualLastPageIndex;

  async function handleMarkComplete() {
    if (completed) return;
    setMarking(true);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/access`, { method: "POST" });
      if (res.ok) {
        setCompleted(true);
        router.refresh();
      }
    } finally {
      setMarking(false);
    }
  }

  function goPrev() {
    setCurrentPage((p) => Math.max(0, p - 1));
  }

  function goNext() {
    if (currentPage < actualLastPageIndex) setCurrentPage((p) => p + 1);
  }

  return (
    <article className="flex min-h-[70vh] flex-col">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[#6b7280]">
        <Link href="/dashboard/trainee/learn" className="hover:text-[var(--unipod-blue)]">
          Courses
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/dashboard/trainee/learn/${programId}`} className="hover:text-[var(--unipod-blue)]">
          {programName}
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/dashboard/trainee/learn/${programId}/${moduleId}`} className="hover:text-[var(--unipod-blue)]">
          Module
        </Link>
      </nav>

      {/* Title - fixed at top for context */}
      <h1 className="text-2xl font-bold tracking-tight text-[#171717] md:text-3xl" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        {lesson.title}
      </h1>

      {/* Page indicator */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-[#6b7280]">
            Step {currentPage + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentPage(i)}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i === currentPage ? "bg-[var(--unipod-blue)]" : "bg-[#e5e7eb] hover:bg-[#d1d5db]"
                }`}
                style={i === currentPage ? { backgroundColor: "var(--unipod-blue)" } : undefined}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content area - one "page" at a time, no long scroll */}
      <div className="mt-6 flex-1">
        {isContentPage && pages[currentPage] && (
          <div className="max-w-[65ch]" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
            <ContentBlock text={pages[currentPage]} />
          </div>
        )}

        {isVideoPage && lesson.videoUrl && (
          <div className="max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#0a0a0a] shadow-lg">
              <div className="aspect-video w-full">
                {lesson.videoUrl.includes("youtube.com") || lesson.videoUrl.includes("youtu.be") ? (
                  <iframe
                    src={
                      lesson.videoUrl
                        .replace("watch?v=", "embed/")
                        .replace("youtu.be/", "youtube.com/embed/")
                    }
                    title="Lesson video"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <a
                    href={lesson.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full flex-col items-center justify-center gap-3 bg-[#111] text-white hover:bg-[#1a1a1a]"
                  >
                    <span className="rounded-full bg-white/10 p-4">
                      <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    <span className="font-medium">Watch video</span>
                    <span className="text-sm text-white/70">Opens in new tab</span>
                  </a>
                )}
              </div>
              <div className="border-t border-[#262626] px-4 py-3">
                <a
                  href={lesson.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#9ca3af] underline hover:text-white"
                >
                  Watch on external player
                </a>
              </div>
            </div>
          </div>
        )}

        {isResourcePage && lesson.resourceUrl && (
          <div className="max-w-md">
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--unipod-blue-light)]" style={{ backgroundColor: "var(--unipod-blue-light)" }}>
                  <svg className="h-6 w-6" style={{ color: "var(--unipod-blue)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[#171717]">Resource</p>
                  <p className="text-sm text-[#6b7280]">Open link to read or download</p>
                </div>
              </div>
              <a
                href={lesson.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors hover:opacity-90"
                style={{ borderColor: "var(--unipod-blue)", color: "var(--unipod-blue)" }}
              >
                Open resource
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {pages.length === 0 && !hasVideo && !hasResource && (
          <p className="max-w-[65ch] text-[17px] leading-[1.75] text-[#6b7280]">
            No content in this chapter yet.
          </p>
        )}
      </div>

      {/* Footer: Prev / Next / Mark complete */}
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#e5e7eb] pt-6">
        <div className="flex items-center gap-2">
          {currentPage > 0 ? (
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center gap-1 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[var(--sidebar-bg)]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
          ) : (
            <Link
              href={prevLessonId ? `/dashboard/trainee/learn/${programId}/${moduleId}/${prevLessonId}` : `/dashboard/trainee/learn/${programId}/${moduleId}`}
              className="inline-flex items-center gap-1 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[var(--sidebar-bg)]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to module
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          {completed && (
            <span className="inline-flex items-center gap-2 rounded-xl bg-green-100 px-4 py-2.5 text-sm font-medium text-green-800">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Complete
            </span>
          )}
          {!completed && showMarkComplete && (
            <button
              type="button"
              onClick={handleMarkComplete}
              disabled={marking}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              {marking ? "Saving…" : (
                <>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Mark as complete
                </>
              )}
            </button>
          )}
          {!showMarkComplete && currentPage < actualLastPageIndex && (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              Next
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {showMarkComplete && nextLessonId && (
            <Link
              href={`/dashboard/trainee/learn/${programId}/${moduleId}/${nextLessonId}`}
              className="inline-flex items-center gap-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              Next chapter
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
}
