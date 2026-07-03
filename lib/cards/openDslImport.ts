import { gunzipSync } from "zlib";

import type { PrismaClient } from "@prisma/client";

import { confirmedB2CardSeedWords, defaultCardDictionary } from "@/lib/cardDictionaryData";

const openDslUrl =
  "https://raw.githubusercontent.com/open-dsl-dict/wiktionary-dict/master/dsl/oneway/en-ru-enwiktionary.dsl.dz";
const cefrJUrl =
  "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv";

type ParsedEntry = {
  english: string;
  transcription: string | null;
  translation: string;
};

const cefrPriority: Record<string, number> = {
  B2: 0,
  B1: 1,
  C1: 2,
  A2: 3,
  A1: 4,
  C2: 5
};

function normalizeEnglishWord(word: string) {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function cleanTranslation(rawBody: string, english: string) {
  const cleaned = rawBody
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/<<[^>]+>>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\/[^/]*\//g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/~+/g, english)
    .replace(/\s+/g, " ")
    .trim();

  const chunks = cleaned.match(/[\u0400-\u04FF][\u0400-\u04FF ,;-]{2,}/g) ?? [];
  const unique = chunks
    .map((item) =>
      item
        .replace(/\s*[,;]\s*/g, ", ")
        .replace(/\s+/g, " ")
        .replace(/^[,; ]+|[,; ]+$/g, "")
        .trim()
    )
    .filter((item) => item.length >= 3);

  return [...new Set(unique)].slice(0, 2).join("; ");
}

function extractTranscription(rawBody: string) {
  const match = rawBody.match(/\/([^/\u0400-\u04FF]{2,80})\//);
  return match ? `/${match[1].trim()}/` : null;
}

function parseDsl(text: string) {
  const lines = text.split(/\r?\n/);
  const entries = new Map<string, ParsedEntry>();
  let current: string | null = null;
  let body: string[] = [];

  function flush() {
    if (!current) {
      return;
    }

    const english = normalizeEnglishWord(current);
    if (!/^[a-z][a-z-]{2,24}$/.test(english) || entries.has(english)) {
      return;
    }

    const rawBody = body.join(" ");
    const translation = cleanTranslation(rawBody, english);
    if (!translation || translation.length > 180) {
      return;
    }

    entries.set(english, {
      english,
      transcription: extractTranscription(rawBody),
      translation
    });
  }

  for (const line of lines) {
    if (!line || line.startsWith("#")) {
      continue;
    }

    if (/^\s/.test(line)) {
      body.push(line.trim());
    } else {
      flush();
      current = line.trim();
      body = [];
    }
  }

  flush();
  return entries;
}

function parseCefrOrder(csv: string) {
  const lines = csv.replace(/\r/g, "").split("\n").filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  const headwordIndex = headers.indexOf("headword");
  const levelIndex = headers.indexOf("CEFR");

  return lines
    .slice(1)
    .map((line, index) => {
      const values = parseCsvLine(line);
      return {
        word: normalizeEnglishWord(values[headwordIndex] ?? ""),
        level: values[levelIndex] ?? "",
        index
      };
    })
    .filter((item) => /^[a-z][a-z-]{2,24}$/.test(item.word))
    .sort((left, right) => {
      return (cefrPriority[left.level] ?? 99) - (cefrPriority[right.level] ?? 99) || left.index - right.index;
    });
}

function exampleFor(word: string, translation: string) {
  return {
    exampleEn: `The word "${word}" is useful in everyday English.`,
    exampleRu: `Слово "${word}" полезно в повседневном английском. Перевод: ${translation}.`
  };
}

export async function importOpenDslCardDictionary(
  prisma: PrismaClient,
  dictionaryId: string,
  options: { limit?: number } = {}
) {
  const limit = options.limit ?? 2500;
  const [dslResponse, cefrResponse] = await Promise.all([fetch(openDslUrl), fetch(cefrJUrl)]);

  if (!dslResponse.ok) {
    throw new Error(`Failed to download Open DSL dictionary: ${dslResponse.status}`);
  }

  if (!cefrResponse.ok) {
    throw new Error(`Failed to download CEFR-J profile: ${cefrResponse.status}`);
  }

  const dslBuffer = Buffer.from(await dslResponse.arrayBuffer());
  const dslText = gunzipSync(dslBuffer).toString("utf16le");
  const dictionary = parseDsl(dslText);
  const cefrOrder = parseCefrOrder(await cefrResponse.text());
  const curatedByWord = new Map(confirmedB2CardSeedWords.map((word) => [normalizeEnglishWord(word.english), word]));
  const selected = new Map<string, ParsedEntry & { exampleEn: string; exampleRu: string; source: string }>();

  for (const item of cefrOrder) {
    const parsed = dictionary.get(item.word);
    if (!parsed) {
      continue;
    }

    const curated = curatedByWord.get(item.word);
    const examples = curated ?? exampleFor(parsed.english, parsed.translation);

    selected.set(item.word, {
      english: parsed.english,
      transcription: curated?.transcription ?? parsed.transcription ?? "",
      translation: curated?.translation ?? parsed.translation,
      exampleEn: examples.exampleEn,
      exampleRu: examples.exampleRu,
      source: `${defaultCardDictionary.sourceName}; Wiktionary English-Russian Open DSL`
    });

    if (selected.size >= limit) {
      break;
    }
  }

  for (const word of confirmedB2CardSeedWords) {
    const normalized = normalizeEnglishWord(word.english);
    if (!selected.has(normalized)) {
      selected.set(normalized, { ...word, source: defaultCardDictionary.sourceName });
    }
  }

  const words = [...selected.values()].slice(0, limit);

  await prisma.dictionaryWord.deleteMany({
    where: {
      dictionaryId,
      englishNormalized: {
        notIn: words.map((word) => normalizeEnglishWord(word.english))
      }
    }
  });

  for (const [index, word] of words.entries()) {
    await prisma.dictionaryWord.upsert({
      where: {
        dictionaryId_englishNormalized: {
          dictionaryId,
          englishNormalized: normalizeEnglishWord(word.english)
        }
      },
      update: {
        english: word.english,
        transcription: word.transcription || null,
        translation: word.translation,
        exampleEn: word.exampleEn,
        exampleRu: word.exampleRu,
        source: word.source,
        position: index
      },
      create: {
        dictionaryId,
        english: word.english,
        englishNormalized: normalizeEnglishWord(word.english),
        transcription: word.transcription || null,
        translation: word.translation,
        exampleEn: word.exampleEn,
        exampleRu: word.exampleRu,
        source: word.source,
        position: index
      }
    });
  }

  return words.length;
}
