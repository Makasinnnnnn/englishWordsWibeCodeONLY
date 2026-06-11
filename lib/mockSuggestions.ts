const translationMap: Record<string, string> = {
  apple: "яблоко",
  book: "книга",
  river: "река",
  cloud: "облако",
  fire: "огонь",
  water: "вода",
  house: "дом",
  tree: "дерево",
  sun: "солнце",
  moon: "луна",
  strange: "странный",
  bizarre: "странный",
  memory: "память",
  learn: "учиться",
  friend: "друг",
  city: "город",
  dream: "мечта",
  light: "свет",
  brave: "смелый",
  quiet: "тихий"
};

export function suggestTranslation(word: string) {
  const key = word.trim().toLowerCase();
  return translationMap[key] ?? "";
}

function escapeSvgText(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function makeFallbackImage(word: string) {
  const label = escapeSvgText((word || "word").trim().slice(0, 18));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop stop-color="#0ea5e9"/>
        <stop offset="1" stop-color="#1f2937"/>
      </linearGradient>
    </defs>
    <rect width="640" height="420" fill="url(#g)"/>
    <circle cx="520" cy="88" r="72" fill="#ffffff" opacity="0.12"/>
    <circle cx="96" cy="330" r="110" fill="#ffffff" opacity="0.08"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#eef2ff" font-family="Arial, sans-serif" font-size="64" font-weight="700">${label}</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function suggestImages(word: string, association?: string | null) {
  const key = word.trim().toLowerCase();
  const label = encodeURIComponent(word || "word");
  const query = encodeURIComponent([word, association].filter(Boolean).join(",") || "english,learning");
  const stableImages: Record<string, string[]> = {
    apple: [
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&w=640&q=80"
    ],
    book: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=640&q=80"
    ],
    river: [
      "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=640&q=80"
    ],
    cloud: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=640&q=80"
    ],
    fire: [
      "https://images.unsplash.com/photo-1517594422361-5eeb8ae275a9?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1523861751938-121b5323b48b?auto=format&fit=crop&w=640&q=80"
    ]
  };

  const remoteImages = [
    ...(stableImages[key] ?? []),
    `https://loremflickr.com/640/420/${query}?lock=11`,
    `https://picsum.photos/seed/${encodeURIComponent(key || "word-memory")}/640/420`,
    `https://placehold.co/640x420/1b222c/eef2ff?text=${label}`
  ].slice(0, 4);

  return [...remoteImages, makeFallbackImage(word)];
}
