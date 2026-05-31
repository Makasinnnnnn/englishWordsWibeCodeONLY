import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeEnglishWord(word: string) {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

const demoWords = [
  {
    english: "apple",
    translation: "яблоко",
    association: "Apple logo / фрукт",
    imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=640&q=80",
    notes: "Связать бренд Apple с настоящим яблоком.",
    difficulty: "easy"
  },
  {
    english: "book",
    translation: "книга",
    association: "учебник",
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=640&q=80",
    notes: "Book звучит коротко и похоже на закрывающуюся книгу.",
    difficulty: "easy"
  },
  {
    english: "river",
    translation: "река",
    association: "поток воды",
    imageUrl: "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=640&q=80",
    notes: "Представить длинный поток, который тянется через карту.",
    difficulty: "medium"
  },
  {
    english: "cloud",
    translation: "облако",
    association: "белое облако",
    imageUrl: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=640&q=80",
    notes: "Cloud также используется для облачных сервисов.",
    difficulty: "medium"
  },
  {
    english: "fire",
    translation: "огонь",
    association: "пламя",
    imageUrl: "https://images.unsplash.com/photo-1517594422361-5eeb8ae275a9?auto=format&fit=crop&w=640&q=80",
    notes: "Представить яркое пламя и слово fire.",
    difficulty: "hard"
  }
];

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      passwordHash: "seeded-demo-user"
    }
  });

  for (const word of demoWords) {
    const existing = await prisma.word.findFirst({
      where: {
        userId: demoUser.id,
        englishNormalized: normalizeEnglishWord(word.english)
      }
    });

    if (!existing) {
      await prisma.word.create({
        data: {
          ...word,
          userId: demoUser.id,
          englishNormalized: normalizeEnglishWord(word.english)
        }
      });
    } else if (!existing.imageUrl || existing.imageUrl.includes("source.unsplash.com")) {
      await prisma.word.update({
        where: { id: existing.id },
        data: { imageUrl: word.imageUrl }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
