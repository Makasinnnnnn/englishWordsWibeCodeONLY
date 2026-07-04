import { suggestTranslation } from "@/lib/mockSuggestions";

export type TranslationProviderName = "yandex" | "google" | "fallback";

export type CardTranslationResult = {
  word: string;
  translation: string | null;
  examples: Array<{
    en: string;
    ru?: string;
    source?: string;
  }>;
  provider: TranslationProviderName;
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value: unknown) {
  return typeof value === "string" ? decodeHtmlEntities(value).trim() : "";
}

async function translateWithYandex(text: string, sourceLang: string, targetLang: string) {
  const apiKey = process.env.YANDEX_TRANSLATE_API_KEY?.trim();
  const folderId = process.env.YANDEX_TRANSLATE_FOLDER_ID?.trim();

  if (!apiKey || !folderId) {
    return "";
  }

  const response = await fetch("https://translate.api.cloud.yandex.net/translate/v2/translate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Api-Key ${apiKey}`
    },
    body: JSON.stringify({
      sourceLanguageCode: sourceLang,
      targetLanguageCode: targetLang,
      format: "PLAIN_TEXT",
      texts: [text],
      folderId
    })
  });

  if (!response.ok) {
    throw new Error(`Yandex Translate failed: ${response.status}`);
  }

  const data = (await response.json()) as { translations?: Array<{ text?: string }> };
  return cleanText(data.translations?.[0]?.text);
}

async function translateWithGoogle(text: string, sourceLang: string, targetLang: string) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();

  if (!apiKey) {
    return "";
  }

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text"
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Google Translate failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> };
  };
  return cleanText(data.data?.translations?.[0]?.translatedText);
}

async function getDictionaryExample(word: string) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Array<{
      meanings?: Array<{
        definitions?: Array<{ example?: string }>;
      }>;
    }>;
    const example = data
      .flatMap((entry) => entry.meanings ?? [])
      .flatMap((meaning) => meaning.definitions ?? [])
      .map((definition) => cleanText(definition.example))
      .find(Boolean);

    return example ? { en: example, source: "Free Dictionary API" } : null;
  } catch {
    return null;
  }
}

async function translateByConfiguredProvider(text: string, sourceLang: string, targetLang: string) {
  const configured = process.env.TRANSLATE_PROVIDER?.trim().toLowerCase();
  const order =
    configured === "google"
      ? (["google", "yandex"] as const)
      : configured === "yandex"
        ? (["yandex", "google"] as const)
        : (["yandex", "google"] as const);

  for (const provider of order) {
    try {
      const translation =
        provider === "yandex"
          ? await translateWithYandex(text, sourceLang, targetLang)
          : await translateWithGoogle(text, sourceLang, targetLang);

      if (translation) {
        return { translation, provider };
      }
    } catch {
      // Try the next provider, then fallback.
    }
  }

  return { translation: "", provider: "fallback" as const };
}

export async function getCardTranslation(
  word: string,
  options: { sourceLang?: string; targetLang?: string; context?: string } = {}
): Promise<CardTranslationResult> {
  const trimmed = word.trim();
  const sourceLang = options.sourceLang ?? "en";
  const targetLang = options.targetLang ?? "ru";

  if (!trimmed) {
    return { word: trimmed, translation: null, examples: [], provider: "fallback" };
  }

  const translatedWord = await translateByConfiguredProvider(trimmed, sourceLang, targetLang);
  const dictionaryExample = await getDictionaryExample(trimmed);
  const exampleEn =
    dictionaryExample?.en ??
    options.context?.trim() ??
    `I want to remember the word "${trimmed}" and use it in a simple sentence.`;
  const translatedExample =
    translatedWord.provider === "fallback"
      ? ""
      : (await translateByConfiguredProvider(exampleEn, sourceLang, targetLang)).translation;
  const mockTranslation = suggestTranslation(trimmed);

  return {
    word: trimmed,
    translation: translatedWord.translation || mockTranslation || null,
    examples: [
      {
        en: exampleEn,
        ru: translatedExample || undefined,
        source:
          dictionaryExample?.source ??
          (translatedWord.provider === "fallback" ? "Local fallback" : "Generated fallback")
      }
    ],
    provider: translatedWord.provider
  };
}
