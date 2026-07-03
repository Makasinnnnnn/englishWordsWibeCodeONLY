"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Dice5, Dumbbell, Edit3, Plus, Save, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Textarea } from "@/components/Textarea";

export type CardDictionaryWordItem = {
  id: string;
  dictionaryId: string;
  english: string;
  transcription: string | null;
  translation: string;
  exampleEn: string | null;
  exampleRu: string | null;
  source: string | null;
  position: number;
  status: string;
};

export type CardDictionarySetItem = {
  id: string;
  dictionaryId: string;
  title: string;
  description: string | null;
  isToday: boolean;
  words: {
    id: string;
    dictionaryWordId: string;
    position: number;
    word: {
      id: string;
      english: string;
      translation: string;
      transcription: string | null;
    };
  }[];
};

type CardDictionaryClientProps = {
  dictionary: {
    id: string;
    title: string;
    description: string | null;
    sourceName: string | null;
  };
  initialWords: CardDictionaryWordItem[];
  initialSets: CardDictionarySetItem[];
};

type FormState = {
  english: string;
  transcription: string;
  translation: string;
  exampleEn: string;
  exampleRu: string;
  source: string;
};

const emptyForm: FormState = {
  english: "",
  transcription: "",
  translation: "",
  exampleEn: "",
  exampleRu: "",
  source: ""
};

function formFromWord(word: CardDictionaryWordItem): FormState {
  return {
    english: word.english,
    transcription: word.transcription ?? "",
    translation: word.translation,
    exampleEn: word.exampleEn ?? "",
    exampleRu: word.exampleRu ?? "",
    source: word.source ?? ""
  };
}

function toWordPayload(form: FormState, dictionaryId: string) {
  return {
    dictionaryId,
    english: form.english,
    transcription: form.transcription,
    translation: form.translation,
    exampleEn: form.exampleEn,
    exampleRu: form.exampleRu,
    source: form.source || "Manual edit"
  };
}

function normalizeSet(data: CardDictionarySetItem) {
  return {
    ...data,
    words: [...data.words].sort((left, right) => left.position - right.position)
  };
}

export function CardDictionaryClient({ dictionary, initialWords, initialSets }: CardDictionaryClientProps) {
  const [words, setWords] = useState(initialWords);
  const [sets, setSets] = useState(initialSets.map(normalizeSet));
  const [selectedSetId, setSelectedSetId] = useState(initialSets[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [newForm, setNewForm] = useState<FormState>(emptyForm);
  const [setTitle, setSetTitle] = useState("Сегодняшняя тренировка");
  const [setRandomCount, setSetRandomCount] = useState(25);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedSet = sets.find((set) => set.id === selectedSetId) ?? null;
  const selectedWordIds = new Set(selectedSet?.words.map((item) => item.dictionaryWordId) ?? []);
  const visibleWords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return words
      .filter((word) => {
        return (
          !normalizedQuery ||
          word.english.toLowerCase().includes(normalizedQuery) ||
          word.translation.toLowerCase().includes(normalizedQuery) ||
          (word.exampleEn ?? "").toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 120);
  }, [query, words]);

  function updateForm<K extends keyof FormState>(
    setter: (value: FormState) => void,
    form: FormState,
    key: K,
    value: FormState[K]
  ) {
    setter({ ...form, [key]: value });
  }

  function upsertSet(nextSet: CardDictionarySetItem) {
    const normalized = normalizeSet(nextSet);
    setSets((current) => {
      const exists = current.some((item) => item.id === normalized.id);
      const next = exists
        ? current.map((item) => (item.id === normalized.id ? normalized : item))
        : [normalized, ...current];
      return next.sort((left, right) => Number(right.isToday) - Number(left.isToday));
    });
    setSelectedSetId(normalized.id);
  }

  async function createSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/cards/sets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dictionaryId: dictionary.id,
          title: setTitle,
          randomCount: setRandomCount
        })
      });
      const data = (await response.json()) as { set?: CardDictionarySetItem; error?: string };

      if (!response.ok || !data.set) {
        throw new Error(data.error ?? "Не удалось создать набор");
      }

      upsertSet(data.set);
      setMessage(`Набор "${data.set.title}" создан: ${data.set.words.length} слов.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось создать набор");
    } finally {
      setBusy(false);
    }
  }

  async function addRandomWords() {
    if (!selectedSet) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cards/sets/${selectedSet.id}/words`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ randomCount: setRandomCount })
      });
      const data = (await response.json()) as { set?: CardDictionarySetItem; error?: string };

      if (!response.ok || !data.set) {
        throw new Error(data.error ?? "Не удалось добавить случайные слова");
      }

      upsertSet(data.set);
      setMessage(`В наборе теперь ${data.set.words.length} слов.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось добавить случайные слова");
    } finally {
      setBusy(false);
    }
  }

  async function addWordToSet(word: CardDictionaryWordItem) {
    if (!selectedSet) {
      setMessage("Сначала создайте или выберите набор.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cards/sets/${selectedSet.id}/words`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wordIds: [word.id] })
      });
      const data = (await response.json()) as { set?: CardDictionarySetItem; error?: string };

      if (!response.ok || !data.set) {
        throw new Error(data.error ?? "Не удалось добавить слово в набор");
      }

      upsertSet(data.set);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось добавить слово в набор");
    } finally {
      setBusy(false);
    }
  }

  async function removeWordFromSet(wordId: string) {
    if (!selectedSet) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cards/sets/${selectedSet.id}/words`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wordIds: [wordId] })
      });
      const data = (await response.json()) as { set?: CardDictionarySetItem; error?: string };

      if (!response.ok || !data.set) {
        throw new Error(data.error ?? "Не удалось убрать слово из набора");
      }

      upsertSet(data.set);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось убрать слово из набора");
    } finally {
      setBusy(false);
    }
  }

  async function markToday(set: CardDictionarySetItem) {
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cards/sets/${set.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isToday: true })
      });
      const data = (await response.json()) as { set?: CardDictionarySetItem; error?: string };

      if (!response.ok || !data.set) {
        throw new Error(data.error ?? "Не удалось выбрать набор");
      }

      setSets((current) => current.map((item) => ({ ...item, isToday: item.id === data.set!.id })));
      upsertSet({ ...data.set, isToday: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось выбрать набор");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSet(set: CardDictionarySetItem) {
    if (!window.confirm(`Удалить набор "${set.title}"? Слова из общего пула останутся.`)) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cards/sets/${set.id}`, { method: "DELETE" });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Не удалось удалить набор");
      }

      setSets((current) => current.filter((item) => item.id !== set.id));
      setSelectedSetId((current) => (current === set.id ? "" : current));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить набор");
    } finally {
      setBusy(false);
    }
  }

  async function createWord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/cards/words", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toWordPayload(newForm, dictionary.id))
      });
      const data = (await response.json()) as { word?: CardDictionaryWordItem; error?: string };

      if (!response.ok || !data.word) {
        throw new Error(data.error ?? "Не удалось добавить слово");
      }

      setWords((current) => [{ ...data.word!, status: "new" }, ...current]);
      setNewForm(emptyForm);
      setMessage("Слово добавлено в общий пул карточек.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось добавить слово");
    } finally {
      setBusy(false);
    }
  }

  async function saveWord(word: CardDictionaryWordItem) {
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cards/words/${word.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toWordPayload(editForm, dictionary.id))
      });
      const data = (await response.json()) as { word?: CardDictionaryWordItem; error?: string };

      if (!response.ok || !data.word) {
        throw new Error(data.error ?? "Не удалось сохранить слово");
      }

      setWords((current) =>
        current.map((item) => (item.id === word.id ? { ...item, ...data.word!, status: item.status } : item))
      );
      setEditingId(null);
      setMessage("Слово обновлено.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить слово");
    } finally {
      setBusy(false);
    }
  }

  async function deleteWord(word: CardDictionaryWordItem) {
    if (!window.confirm(`Удалить "${word.english}" из общего пула карточек?`)) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cards/words/${word.id}`, { method: "DELETE" });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Не удалось удалить слово");
      }

      setWords((current) => current.filter((item) => item.id !== word.id));
      setSets((current) =>
        current.map((set) => ({ ...set, words: set.words.filter((item) => item.dictionaryWordId !== word.id) }))
      );
      setMessage("Слово удалено из общего пула карточек.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить слово");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sky-200/80">Словарь карточек</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{dictionary.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Общий пул: {words.length} слов. Наборы ниже нужны для отдельных вариантов тренировки, например на сегодня.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={selectedSet ? `/cards?set=${selectedSet.id}` : "/cards"}>
              <Button type="button" variant="primary" icon={<Dumbbell className="h-4 w-4" />}>
                Учить выбранный набор
              </Button>
            </Link>
            <Link href="/words">
              <Button type="button" variant="secondary">
                Мои слова
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-lg border border-sky-300/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
          {message}
        </div>
      ) : null}

      <section className="panel p-5">
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <form className="space-y-3" onSubmit={createSet}>
              <Input
                label="Новый набор"
                value={setTitle}
                onChange={(event) => setSetTitle(event.target.value)}
                required
              />
              <Input
                label="Сколько случайных слов добавить"
                type="number"
                min={1}
                max={100}
                value={setRandomCount}
                onChange={(event) => setSetRandomCount(Number(event.target.value))}
              />
              <Button type="submit" variant="success" icon={<Plus className="h-4 w-4" />} disabled={busy}>
                Создать набор
              </Button>
            </form>

            <Select
              value={selectedSetId}
              onChange={(event) => setSelectedSetId(event.target.value)}
              label="Активный набор"
            >
              <option value="">Не выбран</option>
              {sets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.isToday ? "Сегодня: " : ""}
                  {set.title} ({set.words.length})
                </option>
              ))}
            </Select>

            {selectedSet ? (
              <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedSet.title}</h3>
                  <p className="text-sm text-slate-500">{selectedSet.words.length} слов в наборе</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    icon={<Dice5 className="h-4 w-4" />}
                    onClick={() => void addRandomWords()}
                    disabled={busy}
                  >
                    Добавить рандом
                  </Button>
                  <Button
                    type="button"
                    variant={selectedSet.isToday ? "warning" : "secondary"}
                    onClick={() => void markToday(selectedSet)}
                    disabled={busy}
                  >
                    {selectedSet.isToday ? "Выбран на сегодня" : "Сделать сегодняшним"}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => void deleteSet(selectedSet)}
                    disabled={busy}
                  >
                    Удалить набор
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="max-h-96 space-y-2 overflow-auto rounded-lg border border-white/10 bg-white/[0.025] p-3">
            {selectedSet ? (
              selectedSet.words.length > 0 ? (
                selectedSet.words.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-white">{item.word.english}</p>
                      <p className="text-sm text-slate-500">{item.word.translation}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => void removeWordFromSet(item.dictionaryWordId)}
                      disabled={busy}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="p-4 text-sm text-slate-500">
                  В наборе пока нет слов. Добавьте рандомом или из общего пула ниже.
                </p>
              )
            ) : (
              <p className="p-4 text-sm text-slate-500">Выберите набор, чтобы увидеть его слова.</p>
            )}
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={createWord}>
          <Input
            label="English"
            value={newForm.english}
            onChange={(event) => updateForm(setNewForm, newForm, "english", event.target.value)}
            required
          />
          <Input
            label="Перевод"
            value={newForm.translation}
            onChange={(event) => updateForm(setNewForm, newForm, "translation", event.target.value)}
            required
          />
          <Input
            label="Транскрипция"
            value={newForm.transcription}
            onChange={(event) => updateForm(setNewForm, newForm, "transcription", event.target.value)}
          />
          <Input
            label="Источник"
            value={newForm.source}
            onChange={(event) => updateForm(setNewForm, newForm, "source", event.target.value)}
          />
          <Textarea
            label="Example EN"
            value={newForm.exampleEn}
            onChange={(event) => updateForm(setNewForm, newForm, "exampleEn", event.target.value)}
          />
          <Textarea
            label="Example RU"
            value={newForm.exampleRu}
            onChange={(event) => updateForm(setNewForm, newForm, "exampleRu", event.target.value)}
          />
          <div className="lg:col-span-2">
            <Button type="submit" variant="success" icon={<Plus className="h-4 w-4" />} disabled={busy}>
              Добавить слово в общий пул
            </Button>
          </div>
        </form>
      </section>

      <section className="panel p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по слову, переводу или примеру"
              className="pl-9"
            />
          </div>
          <p className="text-sm text-slate-500">
            Показано {visibleWords.length} из {words.length}
          </p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {visibleWords.map((word) => {
          const editing = editingId === word.id;
          const inSelectedSet = selectedWordIds.has(word.id);

          return (
            <article key={word.id} className="panel p-5">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="English"
                      value={editForm.english}
                      onChange={(event) => updateForm(setEditForm, editForm, "english", event.target.value)}
                    />
                    <Input
                      label="Перевод"
                      value={editForm.translation}
                      onChange={(event) => updateForm(setEditForm, editForm, "translation", event.target.value)}
                    />
                    <Input
                      label="Транскрипция"
                      value={editForm.transcription}
                      onChange={(event) => updateForm(setEditForm, editForm, "transcription", event.target.value)}
                    />
                    <Input
                      label="Источник"
                      value={editForm.source}
                      onChange={(event) => updateForm(setEditForm, editForm, "source", event.target.value)}
                    />
                  </div>
                  <Textarea
                    label="Example EN"
                    value={editForm.exampleEn}
                    onChange={(event) => updateForm(setEditForm, editForm, "exampleEn", event.target.value)}
                  />
                  <Textarea
                    label="Example RU"
                    value={editForm.exampleRu}
                    onChange={(event) => updateForm(setEditForm, editForm, "exampleRu", event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      icon={<Save className="h-4 w-4" />}
                      onClick={() => void saveWord(word)}
                      disabled={busy}
                    >
                      Сохранить
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      icon={<X className="h-4 w-4" />}
                      onClick={() => setEditingId(null)}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-semibold text-white">{word.english}</h3>
                      {word.transcription ? <p className="mt-1 text-sm text-sky-100/80">{word.transcription}</p> : null}
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-slate-300">
                      {word.status}
                    </span>
                  </div>
                  <p className="mt-3 text-lg text-slate-200">{word.translation}</p>
                  {word.exampleEn ? (
                    <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-sm leading-6 text-slate-200">{word.exampleEn}</p>
                      {word.exampleRu ? (
                        <p className="mt-2 text-sm leading-6 text-slate-500">{word.exampleRu}</p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={inSelectedSet ? "warning" : "success"}
                      icon={<Plus className="h-4 w-4" />}
                      onClick={() => void addWordToSet(word)}
                      disabled={busy || inSelectedSet}
                    >
                      {inSelectedSet ? "В наборе" : "В выбранный набор"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      icon={<Edit3 className="h-4 w-4" />}
                      onClick={() => {
                        setEditingId(word.id);
                        setEditForm(formFromWord(word));
                      }}
                    >
                      Редактировать
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => void deleteWord(word)}
                      disabled={busy}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
