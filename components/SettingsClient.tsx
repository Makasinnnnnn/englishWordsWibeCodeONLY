"use client";

import { useEffect, useState } from "react";
import { Download, GalleryHorizontal, RotateCcw, Upload } from "lucide-react";

import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { TrainingSidebar } from "@/components/TrainingSidebar";
import {
  defaultTrainingSettings,
  mergeTrainingSettings,
  trainingSettingsStorageKey,
  type TrainingSettings
} from "@/lib/trainingSettings";

type CardDictionaryOption = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  isDefault: boolean;
  _count: {
    words: number;
  };
};

export function SettingsClient({ cardDictionaries = [] }: { cardDictionaries?: CardDictionaryOption[] }) {
  const [settings, setSettings] = useState<TrainingSettings>(defaultTrainingSettings);
  const [loaded, setLoaded] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [cardResetStatus, setCardResetStatus] = useState<string | null>(null);
  const [selectedDictionaryId, setSelectedDictionaryId] = useState(() => cardDictionaries[0]?.id ?? "");

  useEffect(() => {
    const raw = window.localStorage.getItem(trainingSettingsStorageKey);
    if (raw) {
      setSettings(mergeTrainingSettings(JSON.parse(raw) as Partial<TrainingSettings>));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    window.localStorage.setItem(trainingSettingsStorageKey, JSON.stringify(settings));
  }, [loaded, settings]);

  function resetSettings() {
    setSettings(defaultTrainingSettings);
    window.localStorage.setItem(trainingSettingsStorageKey, JSON.stringify(defaultTrainingSettings));
  }

  async function importWords(file: File) {
    setImportStatus("Importing words...");

    const response = await fetch("/api/import/words", {
      method: "POST",
      headers: { "content-type": "text/csv; charset=utf-8" },
      body: await file.text()
    });
    const data = (await response.json()) as {
      data?: { created: number; skipped: number; errors: Array<{ row: number; message: string }> };
      error?: string;
    };

    if (!response.ok || !data.data) {
      setImportStatus(data.error ?? "Import failed");
      return;
    }

    setImportStatus(
      `Imported ${data.data.created} words, skipped ${data.data.skipped}. ${data.data.errors.length} rows need attention.`
    );
  }

  async function resetCardProgress(scope: "selected" | "all") {
    if (
      !window.confirm(
        scope === "selected" ? "Сбросить прогресс выбранного словаря карточек?" : "Сбросить весь прогресс карточек?"
      )
    ) {
      return;
    }

    setCardResetStatus("Сбрасываю прогресс карточек...");
    const query =
      scope === "selected" && selectedDictionaryId ? `?dictionaryId=${encodeURIComponent(selectedDictionaryId)}` : "";
    const response = await fetch(`/api/cards/progress${query}`, { method: "DELETE" });
    const data = (await response.json()) as { deleted?: number; error?: string };

    if (!response.ok) {
      setCardResetStatus(data.error ?? "Не удалось сбросить прогресс карточек");
      return;
    }

    setCardResetStatus(`Прогресс карточек сброшен. Записей удалено: ${data.deleted ?? 0}.`);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <TrainingSidebar settings={settings} onChange={setSettings} />
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Training Settings</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="mt-1 text-2xl font-semibold text-white">Настройки сохранены в браузере</h2>
          <Button type="button" variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={resetSettings}>
            Сбросить настройки
          </Button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="muted-panel p-4">
            <p className="text-sm text-slate-400">Подсказки</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {
                [
                  settings.showEnglish,
                  settings.showTranslation,
                  settings.showAssociation,
                  settings.showImage,
                  settings.showNotes,
                  settings.showFirstLetter,
                  settings.showWordLength
                ].filter(Boolean).length
              }
            </p>
          </div>
          <div className="muted-panel p-4">
            <p className="text-sm text-slate-400">Этапов лестницы</p>
            <p className="mt-2 text-3xl font-semibold text-white">{settings.ladder.totalSteps}</p>
          </div>
        </div>
        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <p className="text-sm font-medium text-white">CSV import and export</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href="/api/export/words">
              <Button type="button" variant="secondary" icon={<Download className="h-4 w-4" />}>
                Export CSV
              </Button>
            </a>
            <label className="focus-ring inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm font-medium text-slate-100 transition hover:bg-white/[0.1]">
              <Upload className="h-4 w-4" />
              Import CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void importWords(file);
                  }
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          {importStatus ? <p className="mt-3 text-sm text-slate-400">{importStatus}</p> : null}
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <p className="text-sm font-medium text-white">Словарь карточек</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Дефолтная B2-колода используется только во вкладке “Карточки” и не смешивается с личным словарём.
          </p>
          <div className="mt-4 max-w-md">
            <Select
              label="Выбор словаря"
              value={selectedDictionaryId}
              onChange={(event) => setSelectedDictionaryId(event.target.value)}
            >
              {cardDictionaries.map((dictionary) => (
                <option key={dictionary.id} value={dictionary.id}>
                  {dictionary.title} · {dictionary.level ?? "level"} · {dictionary._count.words} слов
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href="/cards">
              <Button type="button" variant="secondary" icon={<GalleryHorizontal className="h-4 w-4" />}>
                Открыть карточки
              </Button>
            </a>
            <Button
              type="button"
              variant="warning"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={() => void resetCardProgress("selected")}
              disabled={!selectedDictionaryId}
            >
              Сбросить выбранный словарь
            </Button>
            <Button
              type="button"
              variant="danger"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={() => void resetCardProgress("all")}
            >
              Сбросить все карточки
            </Button>
          </div>
          {cardResetStatus ? <p className="mt-3 text-sm text-slate-400">{cardResetStatus}</p> : null}
        </div>
      </section>
    </div>
  );
}
