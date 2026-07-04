"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, GalleryHorizontal, RotateCcw, Upload } from "lucide-react";

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
  version: number;
  isDefault: boolean;
  _count: {
    words: number;
  };
};

type CatalogDictionaryItem = {
  slug: string;
  title: string;
  level?: string;
  version: number;
  wordsCount: number;
  updatedAt: string;
  localDictionaryId: string | null;
  localVersion: number | null;
  localWordsCount: number;
  isDownloaded: boolean;
  hasUpdate: boolean;
  isActive: boolean;
};

export function SettingsClient({
  cardDictionaries = [],
  activeDictionaryId
}: {
  cardDictionaries?: CardDictionaryOption[];
  activeDictionaryId?: string | null;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState<TrainingSettings>(defaultTrainingSettings);
  const [loaded, setLoaded] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [cardResetStatus, setCardResetStatus] = useState<string | null>(null);
  const [dictionaryStatus, setDictionaryStatus] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogDictionaryItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [activeId, setActiveId] = useState(activeDictionaryId ?? "");
  const [selectedDictionaryId, setSelectedDictionaryId] = useState(
    () => activeDictionaryId ?? cardDictionaries[0]?.id ?? ""
  );
  const activeDictionary =
    cardDictionaries.find((dictionary) => dictionary.id === activeId) ??
    cardDictionaries.find((dictionary) => dictionary.id === activeDictionaryId) ??
    null;

  useEffect(() => {
    const raw = window.localStorage.getItem(trainingSettingsStorageKey);
    if (raw) {
      setSettings(mergeTrainingSettings(JSON.parse(raw) as Partial<TrainingSettings>));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    void loadCatalog();
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

  async function loadCatalog() {
    setCatalogLoading(true);

    try {
      const response = await fetch("/api/dictionaries/catalog", { cache: "no-store" });
      const data = (await response.json()) as {
        catalog?: CatalogDictionaryItem[];
        activeDictionaryId?: string | null;
        error?: string;
      };

      if (!response.ok || !data.catalog) {
        throw new Error(data.error ?? "Не удалось загрузить каталог словарей");
      }

      setCatalog(data.catalog);
      if (data.activeDictionaryId) {
        setActiveId(data.activeDictionaryId);
        setSelectedDictionaryId(data.activeDictionaryId);
      }
    } catch (error) {
      setDictionaryStatus(error instanceof Error ? error.message : "Не удалось загрузить каталог словарей");
    } finally {
      setCatalogLoading(false);
    }
  }

  async function syncDictionary(slug: string, mode: "download" | "update") {
    setDictionaryStatus(mode === "download" ? "Скачиваю словарь..." : "Обновляю словарь...");

    const response = await fetch(`/api/dictionaries/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug })
    });
    const data = (await response.json()) as {
      result?: {
        dictionaryId: string;
        title: string;
        added: number;
        updated: number;
        preserved: number;
        archived: number;
        version: number;
      };
      error?: string;
    };

    if (!response.ok || !data.result) {
      setDictionaryStatus(data.error ?? "Не удалось синхронизировать словарь");
      return;
    }

    setSelectedDictionaryId(data.result.dictionaryId);
    setDictionaryStatus(
      `${data.result.title}: добавлено ${data.result.added}, обновлено ${data.result.updated}, сохранено с прогрессом ${data.result.preserved}, архивировано ${data.result.archived}.`
    );
    await loadCatalog();
    router.refresh();
  }

  async function selectDictionary(dictionaryId: string) {
    setDictionaryStatus("Выбираю активный словарь...");

    const response = await fetch("/api/dictionaries/select", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dictionaryId })
    });
    const data = (await response.json()) as { dictionary?: { title: string }; error?: string };

    if (!response.ok || !data.dictionary) {
      setDictionaryStatus(data.error ?? "Не удалось выбрать словарь");
      return;
    }

    setSelectedDictionaryId(dictionaryId);
    setActiveId(dictionaryId);
    setDictionaryStatus(`Активный словарь: ${data.dictionary.title}.`);
    await loadCatalog();
    router.refresh();
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

  async function resetCardProgress(scope: "selected" | "all", dictionaryIdOverride?: string) {
    if (
      !window.confirm(
        scope === "selected" ? "Сбросить прогресс выбранного словаря карточек?" : "Сбросить весь прогресс карточек?"
      )
    ) {
      return;
    }

    setCardResetStatus("Сбрасываю прогресс карточек...");
    const targetDictionaryId = dictionaryIdOverride ?? selectedDictionaryId;
    const query =
      scope === "selected" && targetDictionaryId ? `?dictionaryId=${encodeURIComponent(targetDictionaryId)}` : "";
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
            Активный словарь используется в карточках, аналитике и при сбросе прогресса.
          </p>
          {activeDictionary ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              Активный: {activeDictionary.title} · {activeDictionary.level ?? "level"} · v{activeDictionary.version}
            </div>
          ) : null}
          <div className="mt-4 max-w-md">
            <Select
              label="Выбор словаря"
              value={selectedDictionaryId}
              onChange={(event) => setSelectedDictionaryId(event.target.value)}
            >
              {cardDictionaries.map((dictionary) => (
                <option key={dictionary.id} value={dictionary.id}>
                  {dictionary.title} · {dictionary.level ?? "level"} · v{dictionary.version} · {dictionary._count.words}{" "}
                  слов
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="primary"
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => void selectDictionary(selectedDictionaryId)}
              disabled={!selectedDictionaryId}
            >
              Выбрать активным
            </Button>
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
          {dictionaryStatus ? <p className="mt-3 text-sm text-slate-400">{dictionaryStatus}</p> : null}
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Каталог словарей</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Скачивание и обновление сохраняют прогресс совпадающих слов, а удалённые слова архивируются.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={() => void loadCatalog()}
              disabled={catalogLoading}
            >
              Обновить список
            </Button>
          </div>
          <div className="mt-4 grid gap-3">
            {catalog.length > 0 ? (
              catalog.map((item) => {
                const status = item.isActive
                  ? "Активный"
                  : item.hasUpdate
                    ? "Доступно обновление"
                    : item.isDownloaded
                      ? "Скачан"
                      : "Не скачан";

                return (
                  <div key={item.slug} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-white">{item.title}</p>
                          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">
                            {status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          {item.level ?? "level"} · {item.wordsCount} слов · локальная версия{" "}
                          {item.localVersion ?? "нет"} · доступная версия {item.version}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!item.isDownloaded ? (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            icon={<Download className="h-4 w-4" />}
                            onClick={() => void syncDictionary(item.slug, "download")}
                          >
                            Скачать
                          </Button>
                        ) : null}
                        {item.hasUpdate ? (
                          <Button
                            type="button"
                            variant="warning"
                            size="sm"
                            icon={<Download className="h-4 w-4" />}
                            onClick={() => void syncDictionary(item.slug, "update")}
                          >
                            Обновить
                          </Button>
                        ) : null}
                        {item.localDictionaryId ? (
                          <Button
                            type="button"
                            variant={item.isActive ? "success" : "secondary"}
                            size="sm"
                            icon={<CheckCircle2 className="h-4 w-4" />}
                            onClick={() => void selectDictionary(item.localDictionaryId as string)}
                          >
                            Выбрать
                          </Button>
                        ) : null}
                        {item.localDictionaryId ? (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            icon={<RotateCcw className="h-4 w-4" />}
                            onClick={() => {
                              void resetCardProgress("selected", item.localDictionaryId as string);
                            }}
                          >
                            Сбросить прогресс
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">
                {catalogLoading ? "Загружаю каталог..." : "Каталог пока не загружен."}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
