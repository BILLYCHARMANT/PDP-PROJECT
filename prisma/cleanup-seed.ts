/**
 * Cleanup script: Removes all seed/dummy data created by seed.ts
 * Run: npx tsx prisma/cleanup-seed.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function cleanup() {
  console.log("Starting cleanup of seed data (keeping test users)...");

  // Keep seed users but clean up their related data
  const seedEmails = ["admin@unipod.org", "mentor@unipod.org", "trainee@unipod.org"];
  for (const email of seedEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Delete related data but keep the user
      await prisma.enrollment.deleteMany({ where: { traineeId: user.id } });
      await prisma.progress.deleteMany({ where: { traineeId: user.id } });
      await prisma.submission.deleteMany({ where: { traineeId: user.id } });
      await prisma.feedback.deleteMany({ where: { mentorId: user.id } });
      await prisma.cohort.deleteMany({ where: { mentorId: user.id } });
      await prisma.traineeScheduledEvent.deleteMany({ where: { traineeId: user.id } });
      await prisma.traineeScheduledEvent.deleteMany({ where: { mentorId: user.id } });
      await prisma.certificate.deleteMany({ where: { traineeId: user.id } });
      console.log(`Cleaned up data for test user: ${email} (user kept)`);
    }
  }

  // Delete seed programs and all related data
  const seedProgramNames = ["Introduction to PDP", "Advanced PDP"];
  for (const programName of seedProgramNames) {
    const program = await prisma.program.findFirst({ where: { name: programName } });
    if (program) {
      // Get all modules for this program
      const modules = await prisma.module.findMany({ where: { programId: program.id } });
      
      for (const module of modules) {
        // Delete lessons
        await prisma.lesson.deleteMany({ where: { moduleId: module.id } });
        
        // Delete assignments and related data
        const assignments = await prisma.assignment.findMany({ where: { moduleId: module.id } });
        for (const assignment of assignments) {
          // Delete submissions and feedback for this assignment
          const submissions = await prisma.submission.findMany({ where: { assignmentId: assignment.id } });
          for (const submission of submissions) {
            await prisma.feedback.deleteMany({ where: { submissionId: submission.id } });
          }
          await prisma.submission.deleteMany({ where: { assignmentId: assignment.id } });
        }
        await prisma.assignment.deleteMany({ where: { moduleId: module.id } });
        
        // Delete progress records
        await prisma.progress.deleteMany({ where: { moduleId: module.id } });
        
        // Delete lesson access records (get lesson IDs first)
        const lessons = await prisma.lesson.findMany({ where: { moduleId: module.id }, select: { id: true } });
        const lessonIds = lessons.map(l => l.id);
        if (lessonIds.length > 0) {
          await prisma.lessonAccess.deleteMany({ where: { lessonId: { in: lessonIds } } });
        }
      }
      
      // Delete cohorts and enrollments
      const cohorts = await prisma.cohort.findMany({ where: { programId: program.id } });
      for (const cohort of cohorts) {
        await prisma.enrollment.deleteMany({ where: { cohortId: cohort.id } });
        await prisma.traineeScheduledEvent.deleteMany({ where: { cohortId: cohort.id } });
      }
      await prisma.cohort.deleteMany({ where: { programId: program.id } });
      
      // Delete modules
      await prisma.module.deleteMany({ where: { programId: program.id } });
      
      // Delete the program
      await prisma.program.delete({ where: { id: program.id } });
      console.log(`Deleted seed program: ${programName}`);
    }
  }

  console.log("Cleanup completed. All seed data has been removed.");
}

cleanup()
  .catch((e) => {
    console.error("Error during cleanup:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
