"use client";

import type { TrainingSettings } from "@/lib/trainingSettings";
import { cn } from "@/utils/cn";

type HintVisibilityControlsProps = {
  settings: TrainingSettings;
  onChange: (settings: TrainingSettings) => void;
};

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-300 transition hover:bg-white/[0.04]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-white/20 bg-graphite-900 text-sky-400 focus:ring-sky-400"
      />
      {label}
    </label>
  );
}

export function HintVisibilityControls({ settings, onChange }: HintVisibilityControlsProps) {
  const updateLadder = (patch: Partial<TrainingSettings["ladder"]>) => {
    onChange({
      ...settings,
      ladder: {
        ...settings.ladder,
        ...patch
      }
    });
  };

  return (
    <section className="space-y-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Лестница подсказок</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">Настройки финальных этапов и реакции на ошибки.</p>
      </div>

      <Checkbox label="Включить автоматическую лестницу" checked={settings.ladder.auto} onChange={(checked) => updateLadder({ auto: checked })} />

      <div className="space-y-2">
        <p className="text-xs text-slate-500">Количество этапов</p>
        <div className="grid grid-cols-3 gap-2">
          {[4, 5, 6].map((stepCount) => (
            <button
              key={stepCount}
              type="button"
              className={cn(
                "focus-ring h-9 rounded-lg border text-sm transition",
                settings.ladder.totalSteps === stepCount ? "border-sky-300/60 bg-sky-400/15 text-sky-100" : "border-white/10 bg-graphite-900 text-slate-400 hover:bg-white/[0.06]"
              )}
              onClick={() => updateLadder({ totalSteps: stepCount as 4 | 5 | 6 })}
            >
              {stepCount}
            </button>
          ))}
        </div>
      </div>

      <Checkbox label="На финальном этапе показывать первую букву" checked={settings.ladder.finalFirstLetter} onChange={(checked) => updateLadder({ finalFirstLetter: checked })} />
      <Checkbox label="На финальном этапе показывать длину слова" checked={settings.ladder.finalWordLength} onChange={(checked) => updateLadder({ finalWordLength: checked })} />
      <Checkbox label="При ошибке возвращать на предыдущий этап" checked={settings.ladder.stepBackOnWrong} onChange={(checked) => updateLadder({ stepBackOnWrong: checked })} />
      <Checkbox label="При опечатке требовать повторный ввод" checked={settings.ladder.retryTypo} onChange={(checked) => updateLadder({ retryTypo: checked })} />
    </section>
  );
}
