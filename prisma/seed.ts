import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Clearing existing data...');
  await prisma.$transaction([
    prisma.habitLog.deleteMany(),
    prisma.choreCompletion.deleteMany(),
    prisma.choreAssignment.deleteMany(),
    prisma.pointTransaction.deleteMany(),
    prisma.rewardRedemption.deleteMany(),
    prisma.chore.deleteMany(),
    prisma.reward.deleteMany(),
    prisma.habit.deleteMany(),
    prisma.scheduleItem.deleteMany(),
    prisma.shoppingItem.deleteMany(),
    prisma.task.deleteMany(),
    prisma.familyMember.deleteMany(),
  ]);

  // Seed Family Members
  console.log('👨‍👩‍👧‍👦 Creating family members...');

  const mom = await prisma.familyMember.create({
    data: {
      name: 'Mom',
      avatar: '👩',
      color: '#ec4899', // Pink
      role: 'PARENT',
      email: 'mom@example.com',
    },
  });

  const dad = await prisma.familyMember.create({
    data: {
      name: 'Dad',
      avatar: '👨',
      color: '#3b82f6', // Blue
      role: 'PARENT',
      email: 'dad@example.com',
    },
  });

  const emma = await prisma.familyMember.create({
    data: {
      name: 'Emma',
      avatar: '👧',
      color: '#22c55e', // Green
      role: 'CHILD',
    },
  });

  const jack = await prisma.familyMember.create({
    data: {
      name: 'Jack',
      avatar: '👦',
      color: '#f59e0b', // Amber
      role: 'CHILD',
    },
  });

  const lily = await prisma.familyMember.create({
    data: {
      name: 'Lily',
      avatar: '👶',
      color: '#a855f7', // Purple
      role: 'CHILD',
    },
  });

  console.log(`   Created ${5} family members`);

  // Seed Settings
  console.log('⚙️ Creating settings...');
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      displayName: 'The Smith Family',
      weatherCity: 'San Francisco',
      weatherLat: 37.7749,
      weatherLon: -122.4194,
      headerMode: 'alternate',
      screensaverEnabled: true,
    },
  });

  // Seed Points Settings
  await prisma.pointsSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      cashConversionRate: 0.1, // 10 pts = $1
      minCashoutPoints: 100,
    },
  });

  // Seed Chores
  console.log('🧹 Creating chores...');
  const choreData = [
    { title: 'Make Bed', icon: '🛏️', points: 5, recurrence: 'DAILY', description: 'Make your bed neatly every morning' },
    { title: 'Clean Room', icon: '🧹', points: 15, recurrence: 'WEEKLY', recurDays: '["SAT"]', description: 'Vacuum, dust, and organize your room' },
    { title: 'Take Out Trash', icon: '🗑️', points: 5, recurrence: 'CUSTOM', recurDays: '["MON","THU"]' },
    { title: 'Feed Pet', icon: '🐕', points: 3, recurrence: 'DAILY', description: 'Feed and water the dog' },
    { title: 'Set Table', icon: '🍽️', points: 3, recurrence: 'DAILY', description: 'Set the table before dinner' },
    { title: 'Load Dishwasher', icon: '🍳', points: 5, recurrence: 'DAILY', description: 'Load dishes after dinner' },
    { title: 'Unload Dishwasher', icon: '🥣', points: 5, recurrence: 'DAILY', description: 'Unload clean dishes in the morning' },
    { title: 'Fold Laundry', icon: '👕', points: 10, recurrence: 'WEEKLY', recurDays: '["SUN"]' },
  ];

  const chores = [];
  for (const chore of choreData) {
    const created = await prisma.chore.create({ data: chore });
    chores.push(created);
  }

  // Assign chores to kids
  console.log('📋 Assigning chores...');
  const kids = [emma, jack, lily];
  for (const chore of chores) {
    // Assign each chore to 2-3 random kids
    const assignees = kids.slice(0, Math.floor(Math.random() * 2) + 2);
    for (const kid of assignees) {
      await prisma.choreAssignment.create({
        data: {
          choreId: chore.id,
          assigneeId: kid.id,
        },
      });
    }
  }

  console.log(`   Created ${chores.length} chores with assignments`);

  // Seed Rewards
  console.log('🎁 Creating rewards...');
  const rewardData = [
    { name: 'Extra Screen Time (30 min)', pointsCost: 20, icon: '📱', description: '30 minutes of extra tablet or TV time' },
    { name: 'Choose Dinner', pointsCost: 50, icon: '🍕', description: 'Pick what the family has for dinner' },
    { name: 'Stay Up Late (1 hour)', pointsCost: 30, icon: '🌙', description: 'Stay up one hour past bedtime' },
    { name: '$5 Allowance', pointsCost: 50, icon: '💵', isCashReward: true, cashValue: 5 },
    { name: '$10 Allowance', pointsCost: 100, icon: '💰', isCashReward: true, cashValue: 10 },
    { name: 'Movie Night Pick', pointsCost: 40, icon: '🎬', description: 'Choose the movie for family movie night' },
    { name: 'Skip One Chore', pointsCost: 25, icon: '🎟️', description: 'Skip one regular chore (not pet feeding)' },
    { name: 'Ice Cream Trip', pointsCost: 75, icon: '🍦', description: 'Trip to the ice cream shop' },
    { name: 'Friend Sleepover', pointsCost: 150, icon: '🏠', description: 'Have a friend sleep over' },
    { name: 'New Book', pointsCost: 80, icon: '📚', description: 'Pick a new book to buy' },
  ];

  for (const reward of rewardData) {
    await prisma.reward.create({ data: reward });
  }
  console.log(`   Created ${rewardData.length} rewards`);

  // Seed Habits
  console.log('✅ Creating habits...');
  const habitData = [
    { name: 'Brush Teeth (Morning)', icon: '🦷', points: 2 },
    { name: 'Brush Teeth (Night)', icon: '🦷', points: 2 },
    { name: 'Read 15 minutes', icon: '📖', points: 5 },
    { name: 'Exercise', icon: '🏃', points: 3 },
    { name: 'Drink Water (8 glasses)', icon: '💧', points: 2 },
    { name: 'Practice Instrument', icon: '🎹', points: 5 },
    { name: 'No Screen Before Homework', icon: '📵', points: 3 },
    { name: 'Kind Act', icon: '💝', points: 5, frequency: 'DAILY' },
  ];

  for (const habit of habitData) {
    await prisma.habit.create({ data: habit });
  }
  console.log(`   Created ${habitData.length} habits`);

  // Seed Schedule Items
  console.log('📅 Creating schedule items...');
  const scheduleData = [
    { title: 'Wake Up', time: '07:00', icon: '☀️' },
    { title: 'Breakfast', time: '07:30', icon: '🥣' },
    { title: 'School Starts', time: '08:30', icon: '🏫', days: '["MON","TUE","WED","THU","FRI"]' },
    { title: 'Homework Time', time: '16:00', icon: '📚', days: '["MON","TUE","WED","THU","FRI"]' },
    { title: 'Dinner', time: '18:00', icon: '🍽️' },
    { title: 'Family Time', time: '19:00', icon: '🎮' },
    { title: 'Bedtime (Lily)', time: '19:30', icon: '🛏️' },
    { title: 'Bedtime (Emma & Jack)', time: '20:30', icon: '🌙' },
  ];

  for (const item of scheduleData) {
    await prisma.scheduleItem.create({ data: item });
  }
  console.log(`   Created ${scheduleData.length} schedule items`);

  // Seed Shopping Items
  console.log('🛒 Creating shopping items...');
  const shoppingData = [
    { name: 'Milk', store: 'COSTCO', quantity: 2, unit: 'gallons' },
    { name: 'Bread', store: 'TARGET', quantity: 2, unit: 'loaves' },
    { name: 'Apples', store: 'WALMART', quantity: 6, notes: 'Honeycrisp if available' },
    { name: 'Cereal', store: 'COSTCO', quantity: 1, notes: 'Cheerios' },
    { name: 'Chicken Breast', store: 'COSTCO', quantity: 2, unit: 'lbs' },
    { name: 'Pasta', store: 'TARGET', quantity: 3, unit: 'boxes' },
    { name: 'Pasta Sauce', store: 'TARGET', quantity: 2, unit: 'jars' },
    { name: 'Paper Towels', store: 'COSTCO', quantity: 1, unit: 'pack' },
    { name: 'Laundry Detergent', store: 'COSTCO', quantity: 1 },
    { name: 'Bananas', store: 'WALMART', quantity: 1, unit: 'bunch' },
  ];

  for (const item of shoppingData) {
    await prisma.shoppingItem.create({ data: item });
  }
  console.log(`   Created ${shoppingData.length} shopping items`);

  // Seed Tasks
  console.log('📝 Creating tasks...');
  const taskData = [
    { title: 'Schedule dentist appointment', priority: 'MEDIUM', notes: 'For all kids' },
    { title: 'Order birthday cake', priority: 'HIGH', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { title: 'Sign permission slips', priority: 'HIGH' },
    { title: 'Pay soccer registration', priority: 'MEDIUM', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    { title: 'Plan vacation', priority: 'LOW' },
  ];

  for (const task of taskData) {
    await prisma.task.create({ data: task });
  }
  console.log(`   Created ${taskData.length} tasks`);

  // Seed Point Transactions (give kids starting points)
  console.log('💰 Creating point transactions...');

  // Welcome bonus for each kid
  for (const kid of kids) {
    await prisma.pointTransaction.create({
      data: {
        familyMemberId: kid.id,
        amount: 50,
        type: 'BONUS',
        description: 'Welcome bonus!',
      },
    });
  }

  // Add some sample transactions for Emma (most active)
  const emmaTransactions = [
    { amount: 5, type: 'CHORE_COMPLETION', description: 'Made bed' },
    { amount: 5, type: 'CHORE_COMPLETION', description: 'Made bed' },
    { amount: 3, type: 'CHORE_COMPLETION', description: 'Set table' },
    { amount: 10, type: 'BONUS', description: 'Helped with groceries' },
    { amount: -20, type: 'REDEMPTION', description: 'Redeemed: Extra Screen Time' },
    { amount: 5, type: 'CHORE_COMPLETION', description: 'Made bed' },
    { amount: 2, type: 'CHORE_COMPLETION', description: 'Brushed teeth (habit)' },
  ];

  for (const tx of emmaTransactions) {
    await prisma.pointTransaction.create({
      data: {
        familyMemberId: emma.id,
        ...tx,
      },
    });
  }

  // Add some transactions for Jack
  const jackTransactions = [
    { amount: 5, type: 'CHORE_COMPLETION', description: 'Made bed' },
    { amount: 5, type: 'CHORE_COMPLETION', description: 'Took out trash' },
    { amount: 3, type: 'CHORE_COMPLETION', description: 'Fed dog' },
    { amount: 5, type: 'BONUS', description: 'Good behavior' },
  ];

  for (const tx of jackTransactions) {
    await prisma.pointTransaction.create({
      data: {
        familyMemberId: jack.id,
        ...tx,
      },
    });
  }

  // Add some transactions for Lily
  const lilyTransactions = [
    { amount: 3, type: 'CHORE_COMPLETION', description: 'Set table' },
    { amount: 5, type: 'BONUS', description: 'Shared toys nicely' },
  ];

  for (const tx of lilyTransactions) {
    await prisma.pointTransaction.create({
      data: {
        familyMemberId: lily.id,
        ...tx,
      },
    });
  }

  console.log('   Created point transactions');

  // Summary
  console.log('\n✨ Seed complete!');
  console.log('\n📊 Summary:');
  console.log(`   • Family Members: 5 (2 parents, 3 kids)`);
  console.log(`   • Chores: ${chores.length}`);
  console.log(`   • Rewards: ${rewardData.length}`);
  console.log(`   • Habits: ${habitData.length}`);
  console.log(`   • Schedule Items: ${scheduleData.length}`);
  console.log(`   • Shopping Items: ${shoppingData.length}`);
  console.log(`   • Tasks: ${taskData.length}`);
  console.log('\n💰 Point Balances:');

  // Calculate and display balances
  for (const kid of kids) {
    const balance = await prisma.pointTransaction.aggregate({
      where: { familyMemberId: kid.id },
      _sum: { amount: true },
    });
    console.log(`   • ${kid.name}: ${balance._sum.amount || 0} pts`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
