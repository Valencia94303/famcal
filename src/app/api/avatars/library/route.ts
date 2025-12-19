import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Default avatar library categories with emojis
const DEFAULT_AVATARS = {
  animals: [
    { name: "Dog", emoji: "🐕" },
    { name: "Cat", emoji: "🐱" },
    { name: "Bunny", emoji: "🐰" },
    { name: "Bear", emoji: "🐻" },
    { name: "Fox", emoji: "🦊" },
    { name: "Lion", emoji: "🦁" },
    { name: "Penguin", emoji: "🐧" },
    { name: "Owl", emoji: "🦉" },
    { name: "Unicorn", emoji: "🦄" },
    { name: "Dragon", emoji: "🐉" },
    { name: "Butterfly", emoji: "🦋" },
    { name: "Turtle", emoji: "🐢" },
  ],
  people: [
    { name: "Girl 1", emoji: "👧" },
    { name: "Boy 1", emoji: "👦" },
    { name: "Girl 2", emoji: "👧🏻" },
    { name: "Boy 2", emoji: "👦🏻" },
    { name: "Woman", emoji: "👩" },
    { name: "Man", emoji: "👨" },
    { name: "Princess", emoji: "👸" },
    { name: "Prince", emoji: "🤴" },
    { name: "Superhero", emoji: "🦸" },
    { name: "Fairy", emoji: "🧚" },
    { name: "Mage", emoji: "🧙" },
    { name: "Ninja", emoji: "🥷" },
  ],
  fantasy: [
    { name: "Alien", emoji: "👽" },
    { name: "Robot", emoji: "🤖" },
    { name: "Ghost", emoji: "👻" },
    { name: "Zombie", emoji: "🧟" },
    { name: "Vampire", emoji: "🧛" },
    { name: "Mermaid", emoji: "🧜" },
    { name: "Elf", emoji: "🧝" },
    { name: "Genie", emoji: "🧞" },
    { name: "Monster", emoji: "👾" },
    { name: "Skull", emoji: "💀" },
    { name: "Pumpkin", emoji: "🎃" },
    { name: "Clown", emoji: "🤡" },
  ],
  objects: [
    { name: "Star", emoji: "⭐" },
    { name: "Heart", emoji: "❤️" },
    { name: "Sun", emoji: "☀️" },
    { name: "Moon", emoji: "🌙" },
    { name: "Rainbow", emoji: "🌈" },
    { name: "Crown", emoji: "👑" },
    { name: "Diamond", emoji: "💎" },
    { name: "Fire", emoji: "🔥" },
    { name: "Lightning", emoji: "⚡" },
    { name: "Rocket", emoji: "🚀" },
    { name: "Gaming", emoji: "🎮" },
    { name: "Music", emoji: "🎵" },
  ],
};

// GET - Get avatar library (seeded defaults + custom uploaded)
export async function GET() {
  try {
    // Get custom library avatars from database
    const customAvatars = await prisma.avatarLibrary.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Combine defaults with custom avatars
    const library: Record<string, Array<{ id?: string; name: string; emoji?: string; imageUrl?: string }>> = {};

    // Add default emoji avatars
    for (const [category, avatars] of Object.entries(DEFAULT_AVATARS)) {
      library[category] = avatars.map((a) => ({
        name: a.name,
        emoji: a.emoji,
      }));
    }

    // Add custom avatars from database
    for (const avatar of customAvatars) {
      if (!library[avatar.category]) {
        library[avatar.category] = [];
      }
      library[avatar.category].push({
        id: avatar.id,
        name: avatar.name,
        imageUrl: avatar.imageUrl,
      });
    }

    return NextResponse.json({ library });
  } catch (error) {
    console.error("Error fetching avatar library:", error);
    return NextResponse.json(
      { error: "Failed to fetch avatar library" },
      { status: 500 }
    );
  }
}
