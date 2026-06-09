"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, RefreshCw, Save } from "lucide-react";

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
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationMessage, setTranslationMessage] = useState("");
  const [translationTouched, setTranslationTouched] = useState(Boolean(initialWord?.translation));
  const [submitIntent, setSubmitIntent] = useState<"card" | "training">("card");

  const isEditMode = Boolean(initialWord);

  const canSuggestTranslation = useMemo(
    () => form.english.trim().length > 1 && !translationTouched && !isEditMode,
    [form.english, isEditMode, translationTouched]
  );

  const requestTranslation = useCallback(
    async (force = false, signal?: AbortSignal) => {
      if (!form.english.trim()) {
        setTranslationMessage("Введите английское слово");
        return;
      }

      setTranslationLoading(true);
      setTranslationMessage("");
      try {
        const params = new URLSearchParams({ word: form.english });
        const response = await fetch(`/api/suggest/translation?${params.toString()}`, { signal });
        const data = (await response.json()) as { translation: string; message: string };

        if (data.translation) {
          if (force || !translationTouched) {
            setForm((current) => ({ ...current, translation: data.translation }));
          }
          setTranslationMessage("Предложен mock-перевод");
        } else {
          setTranslationMessage(data.message || "Введите перевод вручную");
        }

        if (force) {
          setTranslationTouched(true);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setTranslationMessage("Не удалось предложить перевод");
        }
      } finally {
        setTranslationLoading(false);
      }
    },
    [form.english, translationTouched]
  );

  useEffect(() => {
    if (!canSuggestTranslation) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      await requestTranslation(false, controller.signal);
    }, 450);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [canSuggestTranslation, requestTranslation]);

  function updateField<K extends keyof WordFormState>(field: K, value: WordFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const parsed = wordMutationSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0] ?? "Invalid value"]))
      );
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

      const data = (await response.json()) as { word?: WordView; error?: string; code?: string };

      if (!response.ok || !data.word) {
        if (data.code === "WORD_ALREADY_EXISTS") {
          setErrors({ english: "Такое слово уже есть в словаре" });
        }

        throw new Error(data.error || "Request failed");
      }

      showToast(isEditMode ? "Слово обновлено" : "Слово добавлено", "success");
      router.push(submitIntent === "training" ? `/training/${data.word.id}` : `/words/${data.word.id}`);
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не удалось сохранить слово", "error");
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
            setTranslationMessage("");
          }}
          placeholder="bizarre"
          error={errors.english}
          required
        />
        <div className="space-y-2">
          <Input
            label="Translation"
            name="translation"
            value={form.translation}
            onChange={(event) => {
              updateField("translation", event.target.value);
              setTranslationTouched(true);
            }}
            placeholder="Введите перевод вручную"
            hint={translationLoading ? "Ищу mock-перевод..." : translationMessage || undefined}
            error={errors.translation}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => void requestTranslation(true)}
            disabled={translationLoading || !form.english.trim()}
          >
            Предложить перевод ещё раз
          </Button>
        </div>
      </div>

      <Textarea
        label="Association text"
        name="association"
        value={form.association}
        onChange={(event) => updateField("association", event.target.value)}
        placeholder="Смешная фраза, личный образ или короткая история"
        error={errors.association}
      />

      <ImagePicker
        value={form.imageUrl}
        onChange={(value) => updateField("imageUrl", value)}
        word={form.english}
        association={form.association}
      />
      {errors.imageUrl ? <p className="-mt-2 text-xs text-red-300">{errors.imageUrl}</p> : null}

      <Textarea
        label="Notes"
        name="notes"
        value={form.notes}
        onChange={(event) => updateField("notes", event.target.value)}
        placeholder="Необязательные заметки"
        error={errors.notes}
      />

      <Select
        label="Difficulty"
        name="difficulty"
        value={form.difficulty}
        onChange={(event) => updateField("difficulty", event.target.value as WordFormState["difficulty"])}
        error={errors.difficulty}
      >
        <option value="easy">easy</option>
        <option value="medium">medium</option>
        <option value="hard">hard</option>
      </Select>

      <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Отмена
        </Button>
        <Button
          type="submit"
          variant="secondary"
          icon={<Dumbbell className="h-4 w-4" />}
          disabled={submitting}
          onClick={() => setSubmitIntent("training")}
        >
          Сохранить и начать тренировку
        </Button>
        <Button
          type="submit"
          variant="primary"
          icon={<Save className="h-4 w-4" />}
          disabled={submitting}
          onClick={() => setSubmitIntent("card")}
        >
          {submitting ? "Сохранение..." : isEditMode ? "Сохранить изменения" : "Добавить слово"}
        </Button>
      </div>
    </form>
  );
}
