// Role-based route protection helpers
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { Role } from "@prisma/client";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export function requireRole(allowedRoles: Role[]) {
  return async () => {
    const session = await requireAuth();
    if (!allowedRoles.includes(session.user.role)) throw new Error("Forbidden");
    return session;
  };
}

export const requireAdmin = requireRole(["ADMIN"]);
export const requireMentor = requireRole(["ADMIN", "MENTOR"]);
export const requireTrainee = requireRole(["ADMIN", "MENTOR", "TRAINEE"]);
