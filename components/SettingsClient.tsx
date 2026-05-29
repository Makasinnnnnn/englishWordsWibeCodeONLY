"use client";

import { useEffect, useState } from "react";

import { TrainingSidebar } from "@/components/TrainingSidebar";
import { defaultTrainingSettings, mergeTrainingSettings, trainingSettingsStorageKey, type TrainingSettings } from "@/lib/trainingSettings";

export function SettingsClient() {
  const [settings, setSettings] = useState<TrainingSettings>(defaultTrainingSettings);

  useEffect(() => {
    const raw = window.localStorage.getItem(trainingSettingsStorageKey);
    if (raw) {
      setSettings(mergeTrainingSettings(JSON.parse(raw) as Partial<TrainingSettings>));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(trainingSettingsStorageKey, JSON.stringify(settings));
  }, [settings]);

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <TrainingSidebar settings={settings} onChange={setSettings} />
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Training Settings</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Настройки сохранены в браузере</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="muted-panel p-4">
            <p className="text-sm text-slate-400">Подсказки</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {[settings.showEnglish, settings.showTranslation, settings.showAssociation, settings.showImage, settings.showNotes, settings.showFirstLetter, settings.showWordLength].filter(Boolean).length}
            </p>
          </div>
          <div className="muted-panel p-4">
            <p className="text-sm text-slate-400">Этапов лестницы</p>
            <p className="mt-2 text-3xl font-semibold text-white">{settings.ladder.totalSteps}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
