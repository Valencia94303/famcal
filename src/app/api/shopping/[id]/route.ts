import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STORES = ["COSTCO", "WALMART", "TARGET", "OTHER"];

// GET single item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.shoppingItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error fetching shopping item:", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping item" },
      { status: 500 }
    );
  }
}

// PUT update item
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, quantity, unit, store, checked, notes } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name.trim();
    if (quantity !== undefined) updateData.quantity = Math.max(1, quantity);
    if (unit !== undefined) updateData.unit = unit || null;
    if (store !== undefined && VALID_STORES.includes(store)) {
      updateData.store = store;
    }
    if (checked !== undefined) updateData.checked = checked;
    if (notes !== undefined) updateData.notes = notes || null;

    const item = await prisma.shoppingItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error updating shopping item:", error);
    return NextResponse.json(
      { error: "Failed to update shopping item" },
      { status: 500 }
    );
  }
}

// DELETE item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.shoppingItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shopping item:", error);
    return NextResponse.json(
      { error: "Failed to delete shopping item" },
      { status: 500 }
    );
  }
}
