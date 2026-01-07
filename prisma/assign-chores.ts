import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Chore {
  id: string;
  title: string;
}

interface FamilyMember {
  id: string;
  name: string;
}

async function assignChores() {
  // Get family members
  const members = await prisma.familyMember.findMany();
  const miguelito = members.find((m: FamilyMember) => m.name === "Miguelito");
  const maggie = members.find((m: FamilyMember) => m.name === "Maggie");

  if (!miguelito || !maggie) {
    console.log("Members not found:", { miguelito: !!miguelito, maggie: !!maggie });
    return;
  }

  // Get chores
  const chores = await prisma.chore.findMany();
  console.log("Available chores:", chores.map((c: Chore) => c.title));

  // Chores for Miguelito (5yo): Make Bed, Feed Pet, Set Table, Clean Room
  const miguelitoChores = ["Make Bed", "Feed Pet", "Set Table", "Clean Room"];

  // Chores for Maggie (3yo): Make Bed, Feed Pet (simpler ones)
  const maggieChores = ["Make Bed", "Feed Pet"];

  // Assign to Miguelito
  for (const title of miguelitoChores) {
    const chore = chores.find((c: Chore) => c.title === title);
    if (chore) {
      const existing = await prisma.choreAssignment.findFirst({
        where: { choreId: chore.id, assigneeId: miguelito.id }
      });
      if (!existing) {
        await prisma.choreAssignment.create({
          data: { choreId: chore.id, assigneeId: miguelito.id }
        });
        console.log(`Assigned "${title}" to Miguelito`);
      } else {
        console.log(`"${title}" already assigned to Miguelito`);
      }
    } else {
      console.log(`Chore "${title}" not found`);
    }
  }

  // Assign to Maggie
  for (const title of maggieChores) {
    const chore = chores.find((c: Chore) => c.title === title);
    if (chore) {
      const existing = await prisma.choreAssignment.findFirst({
        where: { choreId: chore.id, assigneeId: maggie.id }
      });
      if (!existing) {
        await prisma.choreAssignment.create({
          data: { choreId: chore.id, assigneeId: maggie.id }
        });
        console.log(`Assigned "${title}" to Maggie`);
      } else {
        console.log(`"${title}" already assigned to Maggie`);
      }
    } else {
      console.log(`Chore "${title}" not found`);
    }
  }

  console.log("\nDone! Chore assignments complete.");
}

assignChores()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
