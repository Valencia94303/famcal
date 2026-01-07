import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function restoreBackup(filename: string) {
  if (!filename) {
    console.error("Usage: npx ts-node scripts/restore-backup.ts <backup-file.json>");
    process.exit(1);
  }

  if (!fs.existsSync(filename)) {
    console.error(`File not found: ${filename}`);
    process.exit(1);
  }

  console.log(`Restoring from ${filename}...\n`);

  const backup = JSON.parse(fs.readFileSync(filename, "utf-8"));
  const data = backup.data;

  // Clear existing data (in reverse dependency order)
  console.log("Clearing existing data...");
  await prisma.dietaryPreference.deleteMany();
  await prisma.mealPlanItem.deleteMany();
  await prisma.recipeRating.deleteMany();
  await prisma.recipeVariation.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.habitLog.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.choreCompletion.deleteMany();
  await prisma.choreAssignment.deleteMany();
  await prisma.chore.deleteMany();
  await prisma.rewardRedemption.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.shoppingItem.deleteMany();
  await prisma.task.deleteMany();
  await prisma.scheduleItem.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.familyMember.deleteMany();

  // Restore data (in dependency order)
  console.log("Restoring data...\n");

  if (data.familyMembers?.length) {
    await prisma.familyMember.createMany({ data: data.familyMembers });
    console.log(`  ✅ Family Members: ${data.familyMembers.length}`);
  }

  if (data.settings?.length) {
    await prisma.settings.createMany({ data: data.settings });
    console.log(`  ✅ Settings: ${data.settings.length}`);
  }

  if (data.scheduleItems?.length) {
    await prisma.scheduleItem.createMany({ data: data.scheduleItems });
    console.log(`  ✅ Schedule Items: ${data.scheduleItems.length}`);
  }

  if (data.tasks?.length) {
    await prisma.task.createMany({ data: data.tasks });
    console.log(`  ✅ Tasks: ${data.tasks.length}`);
  }

  if (data.shoppingItems?.length) {
    await prisma.shoppingItem.createMany({ data: data.shoppingItems });
    console.log(`  ✅ Shopping Items: ${data.shoppingItems.length}`);
  }

  if (data.chores?.length) {
    await prisma.chore.createMany({ data: data.chores });
    console.log(`  ✅ Chores: ${data.chores.length}`);
  }

  if (data.choreAssignments?.length) {
    await prisma.choreAssignment.createMany({ data: data.choreAssignments });
    console.log(`  ✅ Chore Assignments: ${data.choreAssignments.length}`);
  }

  if (data.choreCompletions?.length) {
    await prisma.choreCompletion.createMany({ data: data.choreCompletions });
    console.log(`  ✅ Chore Completions: ${data.choreCompletions.length}`);
  }

  if (data.rewards?.length) {
    await prisma.reward.createMany({ data: data.rewards });
    console.log(`  ✅ Rewards: ${data.rewards.length}`);
  }

  if (data.rewardRedemptions?.length) {
    await prisma.rewardRedemption.createMany({ data: data.rewardRedemptions });
    console.log(`  ✅ Reward Redemptions: ${data.rewardRedemptions.length}`);
  }

  if (data.pointTransactions?.length) {
    await prisma.pointTransaction.createMany({ data: data.pointTransactions });
    console.log(`  ✅ Point Transactions: ${data.pointTransactions.length}`);
  }

  if (data.habits?.length) {
    await prisma.habit.createMany({ data: data.habits });
    console.log(`  ✅ Habits: ${data.habits.length}`);
  }

  if (data.habitLogs?.length) {
    await prisma.habitLog.createMany({ data: data.habitLogs });
    console.log(`  ✅ Habit Logs: ${data.habitLogs.length}`);
  }

  if (data.recipes?.length) {
    await prisma.recipe.createMany({ data: data.recipes });
    console.log(`  ✅ Recipes: ${data.recipes.length}`);
  }

  if (data.recipeVariations?.length) {
    await prisma.recipeVariation.createMany({ data: data.recipeVariations });
    console.log(`  ✅ Recipe Variations: ${data.recipeVariations.length}`);
  }

  if (data.recipeRatings?.length) {
    await prisma.recipeRating.createMany({ data: data.recipeRatings });
    console.log(`  ✅ Recipe Ratings: ${data.recipeRatings.length}`);
  }

  if (data.mealPlanItems?.length) {
    await prisma.mealPlanItem.createMany({ data: data.mealPlanItems });
    console.log(`  ✅ Meal Plan Items: ${data.mealPlanItems.length}`);
  }

  if (data.dietaryPreferences?.length) {
    await prisma.dietaryPreference.createMany({ data: data.dietaryPreferences });
    console.log(`  ✅ Dietary Preferences: ${data.dietaryPreferences.length}`);
  }

  console.log("\n🎉 Restore complete!");
}

const filename = process.argv[2];
restoreBackup(filename)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
