"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

import { Button } from "@/components/Button";
import { ImagePicker } from "@/components/ImagePicker";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Textarea } from "@/components/Textarea";
import { useToast } from "@/components/Toast";
import { wordMutationSchema } from "@/lib/schemas";
import type { WordView } from "@/lib/wordSerializer";

type WordFormProps = {
  initialWord?: WordView;
};

type WordFormState = {
  english: string;
  translation: string;
  association: string;
  imageUrl: string;
  notes: string;
  difficulty: "easy" | "medium" | "hard";
};

const defaultState: WordFormState = {
  english: "",
  translation: "",
  association: "",
  imageUrl: "",
  notes: "",
  difficulty: "medium"
};

export function WordForm({ initialWord }: WordFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState<WordFormState>(() =>
    initialWord
      ? {
          english: initialWord.english,
          translation: initialWord.translation,
          association: initialWord.association ?? "",
          imageUrl: initialWord.imageUrl ?? "",
          notes: initialWord.notes ?? "",
          difficulty: initialWord.difficulty as WordFormState["difficulty"]
        }
      : defaultState
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [translationTouched, setTranslationTouched] = useState(Boolean(initialWord?.translation));

  const isEditMode = Boolean(initialWord);

  const canSuggestTranslation = useMemo(() => form.english.trim().length > 1 && !translationTouched && !isEditMode, [form.english, isEditMode, translationTouched]);

  useEffect(() => {
    if (!canSuggestTranslation) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const params = new URLSearchParams({ word: form.english });
      const response = await fetch(`/api/suggest/translation?${params.toString()}`, { signal: controller.signal });
      const data = (await response.json()) as { translation: string; message: string };

      if (data.translation) {
        setForm((current) => ({ ...current, translation: data.translation }));
      }
    }, 450);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [canSuggestTranslation, form.english]);

  function updateField<K extends keyof WordFormState>(field: K, value: WordFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const parsed = wordMutationSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0] ?? "Invalid value"])));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(isEditMode ? `/api/words/${initialWord?.id}` : "/api/words", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsed.data)
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = (await response.json()) as { word: WordView };
      showToast(isEditMode ? "Слово обновлено" : "Слово добавлено", "success");
      router.push(`/words/${data.word.id}`);
      router.refresh();
    } catch {
      showToast("Не удалось сохранить слово", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel space-y-6 p-5 md:p-6" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <Input
          label="English word"
          name="english"
          value={form.english}
          onChange={(event) => {
            updateField("english", event.target.value);
            if (!isEditMode) {
              setTranslationTouched(false);
            }
          }}
          placeholder="bizarre"
          error={errors.english}
          required
        />
        <Input
          label="Translation"
          name="translation"
          value={form.translation}
          onChange={(event) => {
            updateField("translation", event.target.value);
            setTranslationTouched(true);
          }}
          placeholder="Введите перевод вручную"
          error={errors.translation}
          required
        />
      </div>

      <Textarea
        label="Association text"
        name="association"
        value={form.association}
        onChange={(event) => updateField("association", event.target.value)}
        placeholder="Смешная фраза, личный образ или короткая история"
        error={errors.association}
      />

      <ImagePicker value={form.imageUrl} onChange={(value) => updateField("imageUrl", value)} word={form.english} association={form.association} />
      {errors.imageUrl ? <p className="-mt-2 text-xs text-red-300">{errors.imageUrl}</p> : null}

      <Textarea label="Notes" name="notes" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Необязательные заметки" error={errors.notes} />

      <Select label="Difficulty" name="difficulty" value={form.difficulty} onChange={(event) => updateField("difficulty", event.target.value as WordFormState["difficulty"])} error={errors.difficulty}>
        <option value="easy">easy</option>
        <option value="medium">medium</option>
        <option value="hard">hard</option>
      </Select>

      <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Отмена
        </Button>
        <Button type="submit" variant="primary" icon={<Save className="h-4 w-4" />} disabled={submitting}>
          {submitting ? "Сохранение..." : isEditMode ? "Сохранить изменения" : "Добавить слово"}
        </Button>
      </div>
    </form>
  );
}
