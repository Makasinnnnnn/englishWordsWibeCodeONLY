const fallbackDailyContent = {
  title: "Curiosity and language",
  paragraphEn:
    "When you learn a new word, you are not only memorizing a translation. You are adding a small tool for noticing the world more precisely. A richer vocabulary helps you ask better questions, explain your ideas, and understand people whose experience is different from yours.",
  paragraphRu:
    "Когда ты учишь новое слово, ты запоминаешь не только перевод. Ты добавляешь маленький инструмент, который помогает точнее замечать мир. Более богатый словарь помогает задавать лучшие вопросы, объяснять свои идеи и понимать людей с другим опытом.",
  source: "Fallback learning note for Word Memory Trainer",
  videoTitle: "4 reasons to learn a new language - John McWhorter",
  videoSource: "TED-Ed",
  videoUrl: "https://ed.ted.com/lessons/i9eDOogu/digdeeper?lesson_collection=playing-with-language",
  youtubeEmbedUrl: "https://www.youtube.com/embed/VQRjouwKDlU"
};

const gutenbergAliceUrl = "https://www.gutenberg.org/cache/epub/11/pg11.txt";

const youtubeFeeds = [
  {
    title: "TED-Ed",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCsooa4yRKGN_zEE8iknghZA"
  },
  {
    title: "BBC Learning English",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCHaHD477h-FeBbVh9Sh7syA"
  },
  {
    title: "The Tonight Show",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC8-Th83bH_thdKZDJCrn88g"
  }
];

async function fetchText(url: string, timeoutMs = 4500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 6 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeParagraph(paragraph: string) {
  return paragraph.replace(/\s+/g, " ").trim();
}

function pickGutenbergParagraph(text: string) {
  const firstAliceParagraph = "Alice was beginning to get very tired";
  const aliceStart = text.indexOf(firstAliceParagraph);

  if (aliceStart >= 0) {
    return normalizeParagraph(text.slice(aliceStart).split(/\n\s*\n/)[0]);
  }

  const bookStartMarker = "*** START OF THE PROJECT GUTENBERG EBOOK";
  const bookStart = text.indexOf(bookStartMarker);
  const content = bookStart >= 0 ? text.slice(bookStart) : text;
  const paragraphs = content
    .split(/\n\s*\n/)
    .map(normalizeParagraph)
    .filter((paragraph) => {
      return (
        paragraph.length >= 180 &&
        paragraph.length <= 520 &&
        /Alice|Rabbit|thought|said|looked/i.test(paragraph) &&
        !/^CHAPTER\b/i.test(paragraph) &&
        !/CHAPTER [IVX]+\./i.test(paragraph)
      );
    });

  return paragraphs[0] ?? fallbackDailyContent.paragraphEn;
}

function translateKnownParagraph(paragraph: string) {
  if (paragraph.startsWith("Alice was beginning to get very tired")) {
    return "Алисе начинало очень надоедать сидеть рядом с сестрой на берегу без всякого дела. Раз или два она заглянула в книгу, которую читала сестра, но в ней не было ни картинок, ни разговоров. «И что толку в книге, - подумала Алиса, - если в ней нет ни картинок, ни разговоров?»";
  }

  if (paragraph.includes("Alice")) {
    return "Алиса заметила что-то необычное и попыталась понять, что происходит. Этот фрагмент удобно читать как короткое упражнение: сначала английский текст, затем перевод и новые слова.";
  }

  return fallbackDailyContent.paragraphRu;
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function parseYoutubeVideo() {
  const feed = youtubeFeeds[Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % youtubeFeeds.length];
  const xml = await fetchText(feed.url);
  const videoId = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
  const title = decodeXml(xml.match(/<media:title>([^<]+)<\/media:title>/)?.[1] ?? feed.title);

  if (!videoId) {
    throw new Error("YouTube feed did not contain a video id");
  }

  return {
    videoTitle: title,
    videoSource: feed.title,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    youtubeEmbedUrl: `https://www.youtube.com/embed/${videoId}`
  };
}

export async function getDailyContent() {
  try {
    const [aliceText, video] = await Promise.all([fetchText(gutenbergAliceUrl), parseYoutubeVideo()]);
    const paragraphEn = pickGutenbergParagraph(aliceText);

    return {
      title: "Alice's Adventures in Wonderland",
      paragraphEn,
      paragraphRu: translateKnownParagraph(paragraphEn),
      source: "Project Gutenberg: Alice's Adventures in Wonderland by Lewis Carroll",
      ...video
    };
  } catch {
    return fallbackDailyContent;
  }
}
