import { PrismaClient } from "@prisma/client";

import { defaultCardDictionary } from "../lib/cardDictionaryData";
import { importOpenDslCardDictionary } from "../lib/cards/openDslImport";

const prisma = new PrismaClient();

async function main() {
  const dictionary = await prisma.dictionary.upsert({
    where: { slug: defaultCardDictionary.slug },
    update: {
      ...defaultCardDictionary,
      isDefault: true
    },
    create: {
      ...defaultCardDictionary,
      isDefault: true
    }
  });

  const imported = await importOpenDslCardDictionary(prisma, dictionary.id, { limit: 2500 });
  console.log(`Imported ${imported} default card words from Open DSL/Wiktionary + CEFR-J order.`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
