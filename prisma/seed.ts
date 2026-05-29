import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const demoWords = [
  {
    english: "apple",
    translation: "яблоко",
    association: "Apple logo / фрукт",
    imageUrl: "https://source.unsplash.com/640x420/?apple,fruit&sig=11",
    notes: "Связать бренд Apple с настоящим яблоком.",
    difficulty: "easy"
  },
  {
    english: "book",
    translation: "книга",
    association: "учебник",
    imageUrl: "https://source.unsplash.com/640x420/?book,study&sig=12",
    notes: "Book звучит коротко и похоже на закрывающуюся книгу.",
    difficulty: "easy"
  },
  {
    english: "river",
    translation: "река",
    association: "поток воды",
    imageUrl: "https://source.unsplash.com/640x420/?river,water&sig=13",
    notes: "Представить длинный поток, который тянется через карту.",
    difficulty: "medium"
  },
  {
    english: "cloud",
    translation: "облако",
    association: "белое облако",
    imageUrl: "https://source.unsplash.com/640x420/?cloud,sky&sig=14",
    notes: "Cloud также используется для облачных сервисов.",
    difficulty: "medium"
  },
  {
    english: "fire",
    translation: "огонь",
    association: "пламя",
    imageUrl: "https://source.unsplash.com/640x420/?fire,flame&sig=15",
    notes: "Представить яркое пламя и слово fire.",
    difficulty: "hard"
  }
];

async function main() {
  for (const word of demoWords) {
    const existing = await prisma.word.findFirst({
      where: { english: word.english }
    });

    if (!existing) {
      await prisma.word.create({ data: word });
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
