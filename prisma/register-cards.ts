import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function registerCards() {
  // Find members first
  const members = await prisma.familyMember.findMany();
  const miguelito = members.find(m => m.name === "Miguelito");
  const maggie = members.find(m => m.name === "Maggie");

  if (!miguelito || !maggie) {
    console.log("Members not found");
    return;
  }

  // Register test cards
  await prisma.familyMember.update({
    where: { id: miguelito.id },
    data: { nfcCardId: "card-miguelito-001" },
  });
  console.log("Registered card for Miguelito: card-miguelito-001");

  await prisma.familyMember.update({
    where: { id: maggie.id },
    data: { nfcCardId: "card-maggie-001" },
  });
  console.log("Registered card for Maggie: card-maggie-001");

  console.log("\nPOS URLs:");
  console.log("Miguelito: http://localhost:3000/pos?card=card-miguelito-001");
  console.log("Maggie:    http://localhost:3000/pos?card=card-maggie-001");
}

registerCards().finally(() => prisma.$disconnect());
