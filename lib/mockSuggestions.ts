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

export function suggestImages(word: string, association?: string | null) {
  const queryParts = [word, association].filter(Boolean).join(" ");
  const query = encodeURIComponent(queryParts || "english learning memory");
  const label = encodeURIComponent(word || "word");

  return [
    `https://source.unsplash.com/640x420/?${query}&sig=1`,
    `https://source.unsplash.com/640x420/?${query},object&sig=2`,
    `https://source.unsplash.com/640x420/?${query},minimal&sig=3`,
    `https://placehold.co/640x420/1b222c/eef2ff?text=${label}`
  ];
}
