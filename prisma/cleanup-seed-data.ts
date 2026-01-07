import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupSeedData() {
  console.log("🧹 Cleaning up old seed data...\n");

  // 1. Clear all shopping items
  const deletedShopping = await prisma.shoppingItem.deleteMany({});
  console.log(`✅ Cleared ${deletedShopping.count} shopping items`);

  // 2. Clear all tasks
  const deletedTasks = await prisma.task.deleteMany({});
  console.log(`✅ Cleared ${deletedTasks.count} tasks`);

  // 3. Update schedule items with correct kid names
  // Update "Bedtime (Lily)" to "Bedtime (Maggie)"
  const lilyUpdate = await prisma.scheduleItem.updateMany({
    where: { title: "Bedtime (Lily)" },
    data: { title: "Bedtime (Maggie)", time: "19:30" },
  });
  console.log(`✅ Updated ${lilyUpdate.count} schedule item(s): Lily → Maggie`);

  // Update "Bedtime (Emma & Jack)" to "Bedtime (Miguelito)"
  const emmaJackUpdate = await prisma.scheduleItem.updateMany({
    where: { title: "Bedtime (Emma & Jack)" },
    data: { title: "Bedtime (Miguelito)", time: "20:30" },
  });
  console.log(`✅ Updated ${emmaJackUpdate.count} schedule item(s): Emma & Jack → Miguelito`);

  console.log("\n🎉 Cleanup complete!");
  console.log("\nCurrent schedule:");
  const schedule = await prisma.scheduleItem.findMany({
    orderBy: { time: "asc" },
  });
  schedule.forEach((item) => {
    console.log(`  ${item.time} - ${item.icon} ${item.title}`);
  });
}

cleanupSeedData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
