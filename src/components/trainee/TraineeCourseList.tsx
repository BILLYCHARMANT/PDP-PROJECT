import Link from "next/link";

type Course = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  duration: string | null;
  moduleCount: number;
};

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=220&fit=crop";

export function TraineeCourseList({ courses }: { courses: Course[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">My learning</h1>
        <p className="mt-1 text-[#6b7280] dark:text-[#9ca3af]">
          Courses for cohorts you’re enrolled in. Open a course to see modules and chapters.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((p) => {
          const imageSrc = p.imageUrl || PLACEHOLDER_IMAGE;
          return (
            <article
              key={p.id}
              className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] shadow-sm overflow-hidden flex flex-col"
            >
              <div className="relative h-44 bg-[var(--sidebar-bg)] dark:bg-[#374151] overflow-hidden">
                <img
                  src={imageSrc}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-[#171717] dark:text-[#f9fafb] text-lg leading-tight">
                  {p.name}
                </h3>
                {p.description && (
                  <p className="mt-2 text-sm text-[#6b7280] dark:text-[#9ca3af] line-clamp-3">
                    {p.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs text-[#6b7280] dark:text-[#9ca3af]">
                  {p.duration && (
                    <span>{p.duration}</span>
                  )}
                  {p.moduleCount > 0 && (
                    <>
                      {p.duration && <span aria-hidden>·</span>}
                      <span>{p.moduleCount} module{p.moduleCount !== 1 ? "s" : ""}</span>
                    </>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard/trainee/learn/${p.id}`}
                    className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--unipod-blue)" }}
                  >
                    Open course
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {courses.length === 0 && (
        <div className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-8 text-center text-[#6b7280] dark:text-[#9ca3af]">
          No courses yet. You will see courses here once you are enrolled in a cohort.
        </div>
      )}
    </div>
  );
}
