import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STORES = ["COSTCO", "WALMART", "TARGET", "OTHER"];

// GET all shopping items, grouped by store
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showChecked = searchParams.get("showChecked") === "true";
    const store = searchParams.get("store");

    const where: Record<string, unknown> = {};
    if (!showChecked) {
      where.checked = false;
    }
    if (store && VALID_STORES.includes(store)) {
      where.store = store;
    }

    const items = await prisma.shoppingItem.findMany({
      where,
      orderBy: [
        { checked: "asc" },
        { store: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Group by store
    const grouped = {
      COSTCO: items.filter((i) => i.store === "COSTCO"),
      WALMART: items.filter((i) => i.store === "WALMART"),
      TARGET: items.filter((i) => i.store === "TARGET"),
      OTHER: items.filter((i) => i.store === "OTHER"),
    };

    return NextResponse.json({ items, grouped });
  } catch (error) {
    console.error("Error fetching shopping items:", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping items" },
      { status: 500 }
    );
  }
}

// POST create a new shopping item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, quantity, unit, store, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      );
    }

    const validStore = store && VALID_STORES.includes(store) ? store : "OTHER";

    const item = await prisma.shoppingItem.create({
      data: {
        name: name.trim(),
        quantity: quantity || 1,
        unit: unit || null,
        store: validStore,
        notes: notes || null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error creating shopping item:", error);
    return NextResponse.json(
      { error: "Failed to create shopping item" },
      { status: 500 }
    );
  }
}

// DELETE all checked items (clear completed)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const store = searchParams.get("store");
    const clearChecked = searchParams.get("clearChecked") === "true";

    if (clearChecked) {
      const where: Record<string, unknown> = { checked: true };
      if (store && VALID_STORES.includes(store)) {
        where.store = store;
      }

      const result = await prisma.shoppingItem.deleteMany({ where });
      return NextResponse.json({ deleted: result.count });
    }

    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  } catch (error) {
    console.error("Error clearing shopping items:", error);
    return NextResponse.json(
      { error: "Failed to clear shopping items" },
      { status: 500 }
    );
  }
}
