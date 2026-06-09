"use client";

import { HintVisibilityControls } from "@/components/HintVisibilityControls";
import type { TrainingSettings } from "@/lib/trainingSettings";

type TrainingSidebarProps = {
  settings: TrainingSettings;
  onChange: (settings: TrainingSettings) => void;
};

function Checkbox({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
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

export function TrainingSidebar({ settings, onChange }: TrainingSidebarProps) {
  const update = (patch: Partial<TrainingSettings>) => {
    onChange({
      ...settings,
      ...patch
    });
  };

  const updateBinding = (key: keyof TrainingSettings["bindings"], value: boolean) => {
    onChange({
      ...settings,
      bindings: {
        ...settings.bindings,
        [key]: value
      }
    });
  };

  return (
    <aside className="panel max-h-[calc(100vh-7rem)] overflow-auto p-4 scrollbar-thin">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Подсказки</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">Выберите элементы, которые видны во время тренировки.</p>
      </div>

      <div className="space-y-1">
        <Checkbox
          label="Показывать английское слово"
          checked={settings.showEnglish}
          onChange={(checked) => update({ showEnglish: checked })}
        />
        <Checkbox
          label="Показывать перевод"
          checked={settings.showTranslation}
          onChange={(checked) => update({ showTranslation: checked })}
        />
        <Checkbox
          label="Показывать ассоциацию"
          checked={settings.showAssociation}
          onChange={(checked) => update({ showAssociation: checked })}
        />
        <Checkbox
          label="Показывать картинку"
          checked={settings.showImage}
          onChange={(checked) => update({ showImage: checked })}
        />
        <Checkbox
          label="Показывать заметки"
          checked={settings.showNotes}
          onChange={(checked) => update({ showNotes: checked })}
        />
        <Checkbox
          label="Показывать первую букву слова"
          checked={settings.showFirstLetter}
          onChange={(checked) => update({ showFirstLetter: checked })}
        />
        <Checkbox
          label="Показывать длину слова"
          checked={settings.showWordLength}
          onChange={(checked) => update({ showWordLength: checked })}
        />
        <Checkbox
          label="Перемешивать слова"
          checked={settings.shuffleWords}
          onChange={(checked) => update({ shuffleWords: checked })}
        />
      </div>

      <section className="mt-5 space-y-2 rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <h3 className="text-sm font-semibold text-white">Связки для запоминания</h3>
        <Checkbox
          label="Ассоциация -> слово"
          checked={settings.bindings.associationToWord}
          onChange={(checked) => updateBinding("associationToWord", checked)}
        />
        <Checkbox
          label="Ассоциация -> картинка"
          checked={settings.bindings.associationToImage}
          onChange={(checked) => updateBinding("associationToImage", checked)}
        />
        <Checkbox
          label="Картинка -> слово"
          checked={settings.bindings.imageToWord}
          onChange={(checked) => updateBinding("imageToWord", checked)}
        />
        <Checkbox
          label="Перевод -> слово"
          checked={settings.bindings.translationToWord}
          onChange={(checked) => updateBinding("translationToWord", checked)}
        />
        <Checkbox
          label="Слово -> перевод"
          checked={settings.bindings.wordToTranslation}
          onChange={(checked) => updateBinding("wordToTranslation", checked)}
        />
      </section>

      <div className="mt-5">
        <HintVisibilityControls settings={settings} onChange={onChange} />
      </div>
    </aside>
  );
}
