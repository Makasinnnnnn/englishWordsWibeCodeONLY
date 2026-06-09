"use client";

import { useEffect, useState } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";

import { Button } from "@/components/Button";
import { TrainingSidebar } from "@/components/TrainingSidebar";
import {
  defaultTrainingSettings,
  mergeTrainingSettings,
  trainingSettingsStorageKey,
  type TrainingSettings
} from "@/lib/trainingSettings";

export function SettingsClient() {
  const [settings, setSettings] = useState<TrainingSettings>(defaultTrainingSettings);
  const [loaded, setLoaded] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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
      </section>
    </div>
  );
}
