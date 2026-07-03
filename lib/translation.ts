import { suggestTranslation } from "@/lib/mockSuggestions";

type TranslationProvider = "yandex" | "google" | "mock";

export type TranslationSuggestion = {
  translation: string;
  provider: TranslationProvider;
  message: string;
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanTranslation(value: unknown) {
  return typeof value === "string" ? decodeHtmlEntities(value).trim() : "";
}

async function translateWithYandex(text: string): Promise<string> {
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
      sourceLanguageCode: "en",
      targetLanguageCode: "ru",
      format: "PLAIN_TEXT",
      texts: [text],
      folderId
    })
  });

  if (!response.ok) {
    throw new Error(`Yandex Translate failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    translations?: Array<{ text?: string }>;
  };

  return cleanTranslation(data.translations?.[0]?.text);
}

async function translateWithGoogle(text: string): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();

  if (!apiKey) {
    return "";
  }

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: "ru",
        format: "text"
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Google Translate failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    data?: {
      translations?: Array<{ translatedText?: string }>;
    };
  };

  return cleanTranslation(data.data?.translations?.[0]?.translatedText);
}

export async function suggestTranslationWithProvider(text: string): Promise<TranslationSuggestion> {
  const trimmed = text.trim();

  if (!trimmed) {
    return { translation: "", provider: "mock", message: "Введите английское слово" };
  }

  try {
    const translation = await translateWithYandex(trimmed);
    if (translation) {
      return { translation, provider: "yandex", message: "Перевод предложен через Yandex Translate API" };
    }
  } catch {
    // Fall through to Google or mock fallback.
  }

  try {
    const translation = await translateWithGoogle(trimmed);
    if (translation) {
      return { translation, provider: "google", message: "Перевод предложен через Google Cloud Translation API" };
    }
  } catch {
    // Fall through to mock fallback.
  }

  const mockTranslation = suggestTranslation(trimmed);

  return {
    translation: mockTranslation,
    provider: "mock",
    message: mockTranslation ? "Перевод предложен из локального fallback-словаря" : "Введите перевод вручную"
  };
}
