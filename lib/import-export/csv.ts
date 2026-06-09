import { wordMutationSchema, type WordMutationInput } from "../schemas";
import type { WordView } from "../wordSerializer";

const csvHeaders = ["english", "translation", "association", "imageUrl", "notes", "difficulty"];

function escapeCsvValue(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
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

export function wordsToCsv(words: WordView[]) {
  const rows = words.map((word) =>
    csvHeaders
      .map((header) => {
        const value = word[header as keyof WordView];
        return escapeCsvValue(value);
      })
      .join(",")
  );

  return [csvHeaders.join(","), ...rows].join("\n");
}

export type CsvImportResult = {
  words: WordMutationInput[];
  errors: Array<{ row: number; message: string }>;
};

export function parseWordsCsv(csv: string): CsvImportResult {
  const lines = csv
    .replace(/\uFEFF/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { words: [], errors: [{ row: 1, message: "CSV file is empty" }] };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const missingHeaders = ["english", "translation"].filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    return {
      words: [],
      errors: [{ row: 1, message: `Missing required columns: ${missingHeaders.join(", ")}` }]
    };
  }

  const words: WordMutationInput[] = [];
  const errors: CsvImportResult["errors"] = [];

  for (const [index, line] of lines.slice(1).entries()) {
    const rowNumber = index + 2;
    const values = parseCsvLine(line);
    const rawWord = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
    const parsed = wordMutationSchema.safeParse(rawWord);

    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        message: parsed.error.issues.map((issue) => issue.message).join("; ")
      });
      continue;
    }

    words.push(parsed.data);
  }

  return { words, errors };
}
