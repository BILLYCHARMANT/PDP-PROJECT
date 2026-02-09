import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FeedbackForm } from "@/components/mentor/FeedbackForm";

export default async function SubmissionReviewPage(
  props: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    (session.user.role !== "MENTOR" && session.user.role !== "ADMIN")
  ) {
    redirect("/dashboard");
  }
  const { id } = await props.params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      assignment: { include: { module: { select: { title: true } } } },
      trainee: { select: { id: true, name: true, email: true } },
      feedback: true,
    },
  });
  if (!submission) notFound();
  return (
    <div
      className="min-h-full rounded-xl p-6 max-w-2xl space-y-6"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <Link
        href="/dashboard/mentor/submissions"
        className="text-sm font-medium text-[#6b7280] hover:text-[#171717]"
      >
        ← Submissions
      </Link>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#171717]">
          {submission.assignment.title}
        </h1>
        <p className="text-sm text-[#6b7280] mt-1">
          {submission.trainee.name} ({submission.trainee.email}) ·{" "}
          {new Date(submission.submittedAt).toLocaleString()} · Status:{" "}
          <span className="font-medium">{submission.status}</span>
        </p>
        {submission.content && (
          <div className="mt-4 rounded-lg bg-[var(--sidebar-bg)] p-4 text-sm text-[#374151] whitespace-pre-wrap">
            {submission.content}
          </div>
        )}
        {submission.externalLink && (
          <p className="mt-2">
            <a
              href={submission.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium"
              style={{ color: "var(--unipod-blue)" }}
            >
              {submission.externalLink} →
            </a>
          </p>
        )}
        {submission.fileUrl && (
          <p className="mt-2">
            <a
              href={submission.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium"
              style={{ color: "var(--unipod-blue)" }}
            >
              Download file →
            </a>
          </p>
        )}
      </div>
      {submission.status === "PENDING" && (
        <FeedbackForm submissionId={submission.id} />
      )}
      {submission.feedback.length > 0 && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-[#171717]">Previous feedback</h2>
          <ul className="mt-2 space-y-2">
            {submission.feedback.map((f) => (
              <li key={f.id} className="text-sm text-[#374151]">
                {f.comment}{" "}
                {f.passed != null &&
                  (f.passed ? "✓ Passed" : "✗ Not passed")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
