import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";

import { normalizeDictionaryWordKey } from "@/lib/dictionaries/active";
import { prisma } from "@/lib/prisma";

const catalogItemSchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  level: z.string().trim().optional(),
  version: z.number().int().positive(),
  wordsCount: z.number().int().nonnegative(),
  url: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1)
});

const dictionaryFileSchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  level: z.string().trim().optional(),
  version: z.number().int().positive(),
  words: z.array(
    z.object({
      externalId: z.string().trim().optional(),
      english: z.string().trim().min(1),
      transcription: z.string().trim().optional(),
      translation: z.string().trim().min(1),
      exampleEn: z.string().trim().optional(),
      exampleRu: z.string().trim().optional(),
      source: z.string().trim().optional()
    })
  )
});

export type DictionaryCatalogItem = z.infer<typeof catalogItemSchema>;
export type DictionaryFile = z.infer<typeof dictionaryFileSchema>;

export type DictionarySyncResult = {
  dictionaryId: string;
  slug: string;
  title: string;
  added: number;
  updated: number;
  preserved: number;
  archived: number;
  version: number;
};

function publicPathFromUrl(url: string) {
  const clean = url.startsWith("/") ? url.slice(1) : url;
  return path.join(process.cwd(), "public", clean);
}

export async function readDictionaryCatalog(): Promise<DictionaryCatalogItem[]> {
  const raw = await readFile(publicPathFromUrl("/dictionaries/catalog.json"), "utf8");
  return z.array(catalogItemSchema).parse(JSON.parse(raw));
}

export async function readDictionaryFile(url: string): Promise<DictionaryFile> {
  if (/^https?:\/\//i.test(url)) {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Dictionary download failed: ${response.status}`);
    }

    return dictionaryFileSchema.parse(await response.json());
  }

  const raw = await readFile(publicPathFromUrl(url), "utf8");
  return dictionaryFileSchema.parse(JSON.parse(raw));
}

export async function findCatalogItem(slug: string) {
  const catalog = await readDictionaryCatalog();
  return catalog.find((item) => item.slug === slug) ?? null;
}

export async function syncDictionaryFromCatalog(slug: string): Promise<DictionarySyncResult | null> {
  const item = await findCatalogItem(slug);

  if (!item) {
    return null;
  }

  const dictionaryFile = await readDictionaryFile(item.url);
  const activeKeys = new Set(dictionaryFile.words.map((word) => normalizeDictionaryWordKey(word.english)));

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.dictionary.findUnique({
      where: { slug: item.slug },
      include: {
        words: {
          select: {
            id: true,
            englishNormalized: true
          }
        }
      }
    });
    const dictionary = await tx.dictionary.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        title: dictionaryFile.title,
        description: dictionaryFile.description,
        level: dictionaryFile.level ?? item.level,
        version: dictionaryFile.version,
        sourceName: "Local dictionary catalog",
        sourceUrl: item.url,
        isDefault: !existing && item.slug.includes("b2")
      },
      update: {
        title: dictionaryFile.title,
        description: dictionaryFile.description,
        level: dictionaryFile.level ?? item.level,
        version: dictionaryFile.version,
        sourceName: "Local dictionary catalog",
        sourceUrl: item.url
      }
    });

    const existingKeys = new Set(existing?.words.map((word) => word.englishNormalized) ?? []);
    let added = 0;
    let updated = 0;

    for (const [position, word] of dictionaryFile.words.entries()) {
      const englishNormalized = normalizeDictionaryWordKey(word.english);
      const exists = existingKeys.has(englishNormalized);

      await tx.dictionaryWord.upsert({
        where: {
          dictionaryId_englishNormalized: {
            dictionaryId: dictionary.id,
            englishNormalized
          }
        },
        create: {
          dictionaryId: dictionary.id,
          externalId: word.externalId,
          english: word.english,
          englishNormalized,
          transcription: word.transcription,
          translation: word.translation,
          exampleEn: word.exampleEn,
          exampleRu: word.exampleRu,
          source: word.source ?? "Local dictionary catalog",
          archived: false,
          position
        },
        update: {
          externalId: word.externalId,
          english: word.english,
          transcription: word.transcription,
          translation: word.translation,
          exampleEn: word.exampleEn,
          exampleRu: word.exampleRu,
          source: word.source ?? "Local dictionary catalog",
          archived: false,
          position
        }
      });

      if (exists) {
        updated += 1;
      } else {
        added += 1;
      }
    }

    const archived = await tx.dictionaryWord.updateMany({
      where: {
        dictionaryId: dictionary.id,
        englishNormalized: { notIn: [...activeKeys] },
        archived: false
      },
      data: { archived: true }
    });

    return {
      dictionaryId: dictionary.id,
      slug: dictionary.slug,
      title: dictionary.title,
      added,
      updated,
      preserved: updated,
      archived: archived.count,
      version: dictionary.version
    };
  });

  return result;
}
