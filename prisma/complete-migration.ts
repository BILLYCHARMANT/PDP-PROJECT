/**
 * Complete Migration Script: Programs → Courses → Modules
 * 
 * This script automates the entire migration process:
 * 1. Creates Courses for existing Programs
 * 2. Links all Modules to their Program's Course
 * 3. Verifies all modules have courseId set
 * 
 * Run: npx tsx prisma/complete-migration.ts
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
  console.log("🚀 Starting complete migration: Programs → Courses → Modules...\n");

  // Step 1: Get all programs with their courses
  const programs = await prisma.program.findMany({
    include: {
      courses: true,
    },
  });

  console.log(`📊 Found ${programs.length} program(s)\n`);

  let totalCoursesCreated = 0;
  let totalModulesLinked = 0;

  // Get all modules that don't have courseId yet
  // Note: programId column may have been removed, so we'll assign orphaned modules to the first program
  const allModules = await prisma.$queryRaw<Array<{ id: string; title: string; courseId: string | null }>>`
    SELECT id, title, "courseId"
    FROM "Module"
    WHERE "courseId" IS NULL
  `;

  console.log(`📦 Found ${allModules.length} module(s) without courseId\n`);

  // Track orphaned modules - assign all to the first program's course
  let orphanedModules = [...allModules];
  
  for (let i = 0; i < programs.length; i++) {
    const program = programs[i];
    // Assign all orphaned modules to the first program
    const modulesToAssign = i === 0 ? orphanedModules : [];
    
    console.log(`📁 Processing program: ${program.name} (${program.id})`);
    if (modulesToAssign.length > 0) {
      console.log(`   - Will assign ${modulesToAssign.length} orphaned module(s) to this program`);
    }
    console.log(`   - Has ${program.courses.length} course(s)`);

    // Step 2: Create a Course for this Program if none exists
    let course = program.courses[0];
    if (!course) {
      console.log(`   ➕ Creating default course for program...`);
      course = await prisma.course.create({
        data: {
          programId: program.id,
          name: `${program.name} Course`, // e.g., "PROGRAMS Course"
          description: program.description || `Main course for ${program.name} program`,
          imageUrl: program.imageUrl,
          duration: program.duration,
          skillOutcomes: program.skillOutcomes,
          status: program.status,
        },
      });
      console.log(`   ✅ Created course: ${course.name} (${course.id})`);
      totalCoursesCreated++;
    } else {
      console.log(`   ✓ Using existing course: ${course.name} (${course.id})`);
    }

    // Step 3: Link modules to this course
    if (modulesToAssign.length > 0) {
      console.log(`   🔗 Linking ${modulesToAssign.length} module(s) to course...`);
      for (const module of modulesToAssign) {
        await prisma.module.update({
          where: { id: module.id },
          data: { courseId: course.id },
        });
        console.log(`      ✓ Linked module: ${module.title}`);
        totalModulesLinked++;
      }
      // Remove assigned modules from orphaned list
      orphanedModules = orphanedModules.filter(m => !modulesToAssign.find(ma => ma.id === m.id));
    } else {
      console.log(`   ✓ No modules to link`);
    }
    console.log("");
  }

  // Step 4: Verify all modules have courseId
  const modulesWithoutCourseRaw = await prisma.$queryRaw<Array<{ id: string; title: string }>>`
    SELECT id, title FROM "Module" WHERE "courseId" IS NULL
  `;
  const modulesWithoutCourse = modulesWithoutCourseRaw.map(m => ({ id: m.id, title: m.title }));

  if (modulesWithoutCourse.length > 0) {
    console.log(`\n⚠️  WARNING: ${modulesWithoutCourse.length} module(s) still without courseId:`);
    modulesWithoutCourse.forEach(m => {
      console.log(`   - ${m.title} (${m.id})`);
    });
    console.log(`\n💡 These modules need to be manually assigned to a course.`);
    console.log(`   You can do this by editing each module and selecting its course.`);
  }

  console.log("=".repeat(60));
  console.log("✅ Migration completed successfully!");
  console.log(`   - Created ${totalCoursesCreated} course(s)`);
  console.log(`   - Linked ${totalModulesLinked} module(s)`);
  console.log("=".repeat(60));
  console.log("\n📝 Next steps:");
  console.log("1. Update schema.prisma: Make courseId required in Module model");
  console.log("2. Run: npx prisma db push");
  console.log("3. Run: npx prisma generate");
}

main()
  .catch((e) => {
    console.error("\n❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
