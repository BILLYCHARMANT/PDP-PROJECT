/**
 * Migration script: Migrate existing Modules to belong to Courses
 * 
 * This script:
 * 1. Makes courseId nullable temporarily in the schema
 * 2. Creates a Course for each existing Program (if no course exists)
 * 3. Links all existing Modules to their Program's Course
 * 4. Makes courseId required again
 * 
 * Run this AFTER: npx prisma db push (with courseId as nullable)
 * Then update schema to make courseId required and run: npx prisma db push again
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting migration: Modules → Courses...");

  // Step 1: Get all programs with courses and their modules
  const programs = await prisma.program.findMany({
    include: {
      courses: {
        include: { modules: true },
      },
    },
  });

  console.log(`Found ${programs.length} program(s)`);

  for (const program of programs) {
    const modules = program.courses.flatMap((c) => c.modules);
    console.log(`\nProcessing program: ${program.name} (${program.id})`);
    console.log(`  - Has ${modules.length} module(s)`);
    console.log(`  - Has ${program.courses.length} course(s)`);

    // Step 2: Create a Course for this Program if none exists
    let course: { id: string; name: string } | null = program.courses[0] ?? null;
    if (!course) {
      console.log(`  - Creating default course for program...`);
      course = await prisma.course.create({
        data: {
          programId: program.id,
          name: `${program.name} Course`,
          description: program.description || `Main course for ${program.name} program`,
          imageUrl: program.imageUrl,
          duration: program.duration,
          skillOutcomes: program.skillOutcomes,
          status: program.status,
        },
      });
      console.log(`  - Created course: ${course.name} (${course.id})`);
    } else {
      console.log(`  - Using existing course: ${course.name} (${course.id})`);
    }

    // Step 3: Link any orphan modules (courseId null) to this course
    const orphanModules = await prisma.module.findMany({
      where: { courseId: null },
    });
    if (orphanModules.length > 0) {
      console.log(`  - Linking ${orphanModules.length} orphan module(s) to course...`);
      for (const module of orphanModules) {
        await prisma.module.update({
          where: { id: module.id },
          data: { courseId: course.id },
        });
        console.log(`    ✓ Linked module: ${module.title}`);
      }
    }
  }

  console.log("\n✅ Migration completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Update schema.prisma: Make courseId required in Module model");
  console.log("2. Run: npx prisma db push");
  console.log("3. Run: npx prisma generate");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
