import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface BackupData {
  version: string;
  exportedAt: string;
  settings?: {
    id: string;
    displayName?: string;
    timezone?: string;
    showWeather?: boolean;
    weatherLocation?: string;
    theme?: string;
    carouselInterval?: number;
    carouselAnimation?: string;
    headerMode?: string;
    headerAlternateInterval?: number;
    weatherLat?: number;
    weatherLon?: number;
    weatherCity?: string;
    screensaverEnabled?: boolean;
    screensaverStartHour?: number;
    screensaverEndHour?: number;
    screensaverPhotoPath?: string;
    screensaverInterval?: number;
  };
  pointsSettings?: {
    id: string;
    cashConversionRate?: number;
    minCashoutPoints?: number;
  };
  familyMembers?: Array<{
    id: string;
    name: string;
    avatar?: string;
    color: string;
    role: string;
    email?: string;
  }>;
  chores?: Array<{
    id: string;
    title: string;
    description?: string;
    icon?: string;
    points: number;
    priority: string;
    recurrence?: string;
    recurDays?: string;
    recurTime?: string;
    isActive: boolean;
  }>;
  choreAssignments?: Array<{
    id: string;
    choreId: string;
    assigneeId: string;
    rotationOrder?: number;
  }>;
  rewards?: Array<{
    id: string;
    name: string;
    description?: string;
    pointsCost: number;
    icon?: string;
    isActive: boolean;
    isCashReward: boolean;
    cashValue?: number;
  }>;
  habits?: Array<{
    id: string;
    name: string;
    icon?: string;
    points: number;
    frequency: string;
    isActive: boolean;
  }>;
  scheduleItems?: Array<{
    id: string;
    title: string;
    time: string;
    icon?: string;
    days?: string;
    isActive: boolean;
  }>;
  shoppingItems?: Array<{
    id: string;
    name: string;
    quantity: number;
    unit?: string;
    store: string;
    checked: boolean;
    notes?: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    priority?: string;
    dueDate?: string;
    startDate?: string;
    scheduledDate?: string;
    recurrence?: string;
    notes?: string;
  }>;
  pointTransactions?: Array<{
    id: string;
    familyMemberId: string;
    amount: number;
    type: string;
    description?: string;
    createdAt?: string;
  }>;
  recipes?: Array<{
    id: string;
    name: string;
    description?: string;
    cuisine?: string;
    icon?: string;
    prepTime?: number;
    cookTime?: number;
    servings: number;
    difficulty: string;
    ingredients: string;
    instructions: string;
    tips?: string;
    tags?: string;
    mealTypes?: string;
    isActive: boolean;
  }>;
  recipeRatings?: Array<{
    id: string;
    recipeId: string;
    familyMemberId?: string;
    rating: number;
    notes?: string;
    wouldMakeAgain: boolean;
  }>;
  recipeVariations?: Array<{
    id: string;
    recipeId: string;
    familyMemberId: string;
    variation: string;
    calories?: number;
    protein?: number;
  }>;
  mealPlanItems?: Array<{
    id: string;
    recipeId?: string;
    weekNumber: number;
    dayOfWeek: string;
    mealType: string;
    customMeal?: string;
    notes?: string;
    isActive: boolean;
  }>;
  dietaryPreferences?: Array<{
    id: string;
    familyMemberId: string;
    targetCalories?: number;
    targetProtein?: number;
    restrictions?: string;
    preferences?: string;
    fastingSchedule?: string;
    notes?: string;
  }>;
}

// POST - Restore from backup JSON
export async function POST(request: Request) {
  try {
    const data: BackupData = await request.json();

    // Validate backup format
    if (!data.version || !data.exportedAt) {
      return NextResponse.json(
        { error: "Invalid backup format: missing version or exportedAt" },
        { status: 400 }
      );
    }

    // Track what was restored
    const restored: Record<string, number> = {};

    // Use a transaction to ensure all-or-nothing restore
    await prisma.$transaction(async (tx) => {
      // Clear existing data (in reverse order of dependencies)
      await tx.habitLog.deleteMany();
      await tx.choreCompletion.deleteMany();
      await tx.choreAssignment.deleteMany();
      await tx.pointTransaction.deleteMany();
      await tx.rewardRedemption.deleteMany();
      await tx.chore.deleteMany();
      await tx.reward.deleteMany();
      await tx.habit.deleteMany();
      await tx.scheduleItem.deleteMany();
      await tx.shoppingItem.deleteMany();
      await tx.task.deleteMany();
      // Clear meal planning data
      await tx.recipeRating.deleteMany();
      await tx.recipeVariation.deleteMany();
      await tx.mealPlanItem.deleteMany();
      await tx.dietaryPreference.deleteMany();
      await tx.recipe.deleteMany();
      await tx.familyMember.deleteMany();

      // Restore settings
      if (data.settings) {
        await tx.settings.upsert({
          where: { id: "singleton" },
          update: {
            displayName: data.settings.displayName,
            timezone: data.settings.timezone,
            showWeather: data.settings.showWeather,
            weatherLocation: data.settings.weatherLocation,
            theme: data.settings.theme,
            carouselInterval: data.settings.carouselInterval,
            carouselAnimation: data.settings.carouselAnimation,
            headerMode: data.settings.headerMode,
            headerAlternateInterval: data.settings.headerAlternateInterval,
            weatherLat: data.settings.weatherLat,
            weatherLon: data.settings.weatherLon,
            weatherCity: data.settings.weatherCity,
            screensaverEnabled: data.settings.screensaverEnabled,
            screensaverStartHour: data.settings.screensaverStartHour,
            screensaverEndHour: data.settings.screensaverEndHour,
            screensaverPhotoPath: data.settings.screensaverPhotoPath,
            screensaverInterval: data.settings.screensaverInterval,
          },
          create: {
            id: "singleton",
            displayName: data.settings.displayName || "Family Dashboard",
            timezone: data.settings.timezone || "America/New_York",
            showWeather: data.settings.showWeather ?? true,
            weatherLocation: data.settings.weatherLocation,
            theme: data.settings.theme || "auto",
            carouselInterval: data.settings.carouselInterval || 30,
            carouselAnimation: data.settings.carouselAnimation || "arrivingTogether",
            headerMode: data.settings.headerMode || "clock",
            headerAlternateInterval: data.settings.headerAlternateInterval || 30,
            weatherLat: data.settings.weatherLat,
            weatherLon: data.settings.weatherLon,
            weatherCity: data.settings.weatherCity,
            screensaverEnabled: data.settings.screensaverEnabled ?? false,
            screensaverStartHour: data.settings.screensaverStartHour || 18,
            screensaverEndHour: data.settings.screensaverEndHour || 23,
            screensaverPhotoPath: data.settings.screensaverPhotoPath || "/home/pi/famcal-photos",
            screensaverInterval: data.settings.screensaverInterval || 15,
          },
        });
        restored.settings = 1;
      }

      // Restore points settings
      if (data.pointsSettings) {
        await tx.pointsSettings.upsert({
          where: { id: "singleton" },
          update: {
            cashConversionRate: data.pointsSettings.cashConversionRate,
            minCashoutPoints: data.pointsSettings.minCashoutPoints,
          },
          create: {
            id: "singleton",
            cashConversionRate: data.pointsSettings.cashConversionRate || 0.1,
            minCashoutPoints: data.pointsSettings.minCashoutPoints || 100,
          },
        });
        restored.pointsSettings = 1;
      }

      // Restore family members
      if (data.familyMembers && data.familyMembers.length > 0) {
        for (const member of data.familyMembers) {
          await tx.familyMember.create({
            data: {
              id: member.id,
              name: member.name,
              avatar: member.avatar,
              color: member.color,
              role: member.role,
              email: member.email,
            },
          });
        }
        restored.familyMembers = data.familyMembers.length;
      }

      // Restore chores
      if (data.chores && data.chores.length > 0) {
        for (const chore of data.chores) {
          await tx.chore.create({
            data: {
              id: chore.id,
              title: chore.title,
              description: chore.description,
              icon: chore.icon,
              points: chore.points,
              priority: chore.priority,
              recurrence: chore.recurrence,
              recurDays: chore.recurDays,
              recurTime: chore.recurTime,
              isActive: chore.isActive,
            },
          });
        }
        restored.chores = data.chores.length;
      }

      // Restore chore assignments
      if (data.choreAssignments && data.choreAssignments.length > 0) {
        for (const assignment of data.choreAssignments) {
          // Only restore if both chore and assignee exist
          try {
            await tx.choreAssignment.create({
              data: {
                id: assignment.id,
                choreId: assignment.choreId,
                assigneeId: assignment.assigneeId,
                rotationOrder: assignment.rotationOrder,
              },
            });
          } catch {
            // Skip if foreign key constraint fails
            console.warn(`Skipping assignment ${assignment.id}: missing chore or assignee`);
          }
        }
        restored.choreAssignments = data.choreAssignments.length;
      }

      // Restore rewards
      if (data.rewards && data.rewards.length > 0) {
        for (const reward of data.rewards) {
          await tx.reward.create({
            data: {
              id: reward.id,
              name: reward.name,
              description: reward.description,
              pointsCost: reward.pointsCost,
              icon: reward.icon,
              isActive: reward.isActive,
              isCashReward: reward.isCashReward,
              cashValue: reward.cashValue,
            },
          });
        }
        restored.rewards = data.rewards.length;
      }

      // Restore habits
      if (data.habits && data.habits.length > 0) {
        for (const habit of data.habits) {
          await tx.habit.create({
            data: {
              id: habit.id,
              name: habit.name,
              icon: habit.icon,
              points: habit.points,
              frequency: habit.frequency,
              isActive: habit.isActive,
            },
          });
        }
        restored.habits = data.habits.length;
      }

      // Restore schedule items
      if (data.scheduleItems && data.scheduleItems.length > 0) {
        for (const item of data.scheduleItems) {
          await tx.scheduleItem.create({
            data: {
              id: item.id,
              title: item.title,
              time: item.time,
              icon: item.icon,
              days: item.days,
              isActive: item.isActive,
            },
          });
        }
        restored.scheduleItems = data.scheduleItems.length;
      }

      // Restore shopping items
      if (data.shoppingItems && data.shoppingItems.length > 0) {
        for (const item of data.shoppingItems) {
          await tx.shoppingItem.create({
            data: {
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              store: item.store,
              checked: item.checked,
              notes: item.notes,
            },
          });
        }
        restored.shoppingItems = data.shoppingItems.length;
      }

      // Restore tasks
      if (data.tasks && data.tasks.length > 0) {
        for (const task of data.tasks) {
          await tx.task.create({
            data: {
              id: task.id,
              title: task.title,
              completed: task.completed,
              priority: task.priority,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              startDate: task.startDate ? new Date(task.startDate) : null,
              scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : null,
              recurrence: task.recurrence,
              notes: task.notes,
            },
          });
        }
        restored.tasks = data.tasks.length;
      }

      // Restore point transactions (for demo/starting balances)
      if (data.pointTransactions && data.pointTransactions.length > 0) {
        for (const transaction of data.pointTransactions) {
          try {
            await tx.pointTransaction.create({
              data: {
                id: transaction.id,
                familyMemberId: transaction.familyMemberId,
                amount: transaction.amount,
                type: transaction.type,
                description: transaction.description,
                createdAt: transaction.createdAt ? new Date(transaction.createdAt) : new Date(),
              },
            });
          } catch {
            // Skip if foreign key constraint fails (member doesn't exist)
            console.warn(`Skipping transaction ${transaction.id}: member not found`);
          }
        }
        restored.pointTransactions = data.pointTransactions.length;
      }

      // Restore recipes
      if (data.recipes && data.recipes.length > 0) {
        for (const recipe of data.recipes) {
          await tx.recipe.create({
            data: {
              id: recipe.id,
              name: recipe.name,
              description: recipe.description,
              cuisine: recipe.cuisine,
              icon: recipe.icon,
              prepTime: recipe.prepTime,
              cookTime: recipe.cookTime,
              servings: recipe.servings,
              difficulty: recipe.difficulty,
              ingredients: recipe.ingredients,
              instructions: recipe.instructions,
              tips: recipe.tips,
              tags: recipe.tags,
              mealTypes: recipe.mealTypes,
              isActive: recipe.isActive,
            },
          });
        }
        restored.recipes = data.recipes.length;
      }

      // Restore recipe ratings
      if (data.recipeRatings && data.recipeRatings.length > 0) {
        for (const rating of data.recipeRatings) {
          try {
            await tx.recipeRating.create({
              data: {
                id: rating.id,
                recipeId: rating.recipeId,
                familyMemberId: rating.familyMemberId,
                rating: rating.rating,
                notes: rating.notes,
                wouldMakeAgain: rating.wouldMakeAgain,
              },
            });
          } catch {
            // Skip if foreign key constraint fails
            console.warn(`Skipping rating ${rating.id}: recipe or member not found`);
          }
        }
        restored.recipeRatings = data.recipeRatings.length;
      }

      // Restore recipe variations
      if (data.recipeVariations && data.recipeVariations.length > 0) {
        for (const variation of data.recipeVariations) {
          try {
            await tx.recipeVariation.create({
              data: {
                id: variation.id,
                recipeId: variation.recipeId,
                familyMemberId: variation.familyMemberId,
                variation: variation.variation,
                calories: variation.calories,
                protein: variation.protein,
              },
            });
          } catch {
            // Skip if foreign key constraint fails
            console.warn(`Skipping variation ${variation.id}: recipe or member not found`);
          }
        }
        restored.recipeVariations = data.recipeVariations.length;
      }

      // Restore meal plan items
      if (data.mealPlanItems && data.mealPlanItems.length > 0) {
        for (const item of data.mealPlanItems) {
          try {
            await tx.mealPlanItem.create({
              data: {
                id: item.id,
                recipeId: item.recipeId,
                weekNumber: item.weekNumber,
                dayOfWeek: item.dayOfWeek,
                mealType: item.mealType,
                customMeal: item.customMeal,
                notes: item.notes,
                isActive: item.isActive,
              },
            });
          } catch {
            // Skip if foreign key constraint fails
            console.warn(`Skipping meal plan item ${item.id}: recipe not found`);
          }
        }
        restored.mealPlanItems = data.mealPlanItems.length;
      }

      // Restore dietary preferences
      if (data.dietaryPreferences && data.dietaryPreferences.length > 0) {
        for (const pref of data.dietaryPreferences) {
          try {
            await tx.dietaryPreference.create({
              data: {
                id: pref.id,
                familyMemberId: pref.familyMemberId,
                targetCalories: pref.targetCalories,
                targetProtein: pref.targetProtein,
                restrictions: pref.restrictions,
                preferences: pref.preferences,
                fastingSchedule: pref.fastingSchedule,
                notes: pref.notes,
              },
            });
          } catch {
            // Skip if foreign key constraint fails
            console.warn(`Skipping dietary preference ${pref.id}: member not found`);
          }
        }
        restored.dietaryPreferences = data.dietaryPreferences.length;
      }
    });

    return NextResponse.json({
      success: true,
      message: "Backup restored successfully",
      restored,
      backupVersion: data.version,
      backupDate: data.exportedAt,
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    return NextResponse.json(
      { error: "Failed to restore backup", details: String(error) },
      { status: 500 }
    );
  }
}
