"use client";

type Lesson = {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  resourceUrl: string | null;
};

export function LessonContent({ lesson }: { lesson: Lesson }) {
  return (
    <div>
      <h3 className="font-medium text-slate-800">{lesson.title}</h3>
      {lesson.content && (
        <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{lesson.content}</div>
      )}
      {lesson.videoUrl && (
        <p className="mt-2">
          <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="link-unipod">
            Watch video
          </a>
        </p>
      )}
      {lesson.resourceUrl && (
        <p className="mt-1">
          <a href={lesson.resourceUrl} target="_blank" rel="noopener noreferrer" className="link-unipod">
            Resource link
          </a>
        </p>
      )}
    </div>
  );
}
