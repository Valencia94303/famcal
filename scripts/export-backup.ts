import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function exportBackup() {
  console.log("Exporting database backup...\n");

  const backup = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    data: {
      familyMembers: await prisma.familyMember.findMany(),
      chores: await prisma.chore.findMany(),
      choreAssignments: await prisma.choreAssignment.findMany(),
      choreCompletions: await prisma.choreCompletion.findMany(),
      rewards: await prisma.reward.findMany(),
      rewardRedemptions: await prisma.rewardRedemption.findMany(),
      pointTransactions: await prisma.pointTransaction.findMany(),
      habits: await prisma.habit.findMany(),
      habitLogs: await prisma.habitLog.findMany(),
      scheduleItems: await prisma.scheduleItem.findMany(),
      tasks: await prisma.task.findMany(),
      shoppingItems: await prisma.shoppingItem.findMany(),
      recipes: await prisma.recipe.findMany(),
      recipeVariations: await prisma.recipeVariation.findMany(),
      recipeRatings: await prisma.recipeRating.findMany(),
      mealPlanItems: await prisma.mealPlanItem.findMany(),
      dietaryPreferences: await prisma.dietaryPreference.findMany(),
      settings: await prisma.settings.findMany(),
    },
  };

  const filename = `backup-${new Date().toISOString().split("T")[0]}.json`;
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));

  console.log(`✅ Backup saved to: ${filename}`);
  console.log(`\nSummary:`);
  console.log(`  Family Members: ${backup.data.familyMembers.length}`);
  console.log(`  Chores: ${backup.data.chores.length}`);
  console.log(`  Rewards: ${backup.data.rewards.length}`);
  console.log(`  Habits: ${backup.data.habits.length}`);
  console.log(`  Schedule Items: ${backup.data.scheduleItems.length}`);
  console.log(`  Recipes: ${backup.data.recipes.length}`);
  console.log(`  Meal Plan Items: ${backup.data.mealPlanItems.length}`);
  console.log(`\nTo restore on Pi:`);
  console.log(`  1. Copy ${filename} to Pi`);
  console.log(`  2. Run: npx ts-node scripts/restore-backup.ts ${filename}`);
}

exportBackup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
