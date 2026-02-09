import { redirect } from "next/navigation";

/** Create Course is the 3-step wizard at /dashboard/courses/new (admin + mentor). */
export default function NewProgramPage() {
  redirect("/dashboard/courses/new");
}
