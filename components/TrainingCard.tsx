"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

import { HiddenHintBlock } from "@/components/HiddenHintBlock";
import type { WordView } from "@/lib/wordSerializer";
import type { HintVisibility } from "@/utils/hintLadder";

type TrainingCardProps = {
  word: WordView;
  visibility: HintVisibility;
  title?: string;
};

export function TrainingCard({ word, visibility, title = "Карточка слова" }: TrainingCardProps) {
  const [imageBroken, setImageBroken] = useState(false);

  useEffect(() => {
    setImageBroken(false);
  }, [word.id, word.imageUrl]);

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{title}</p>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.85fr)]">
        <div className="space-y-4">
          {visibility.showEnglish ? (
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">English word</p>
              <p className="mt-1 text-4xl font-semibold text-white">{word.english}</p>
            </div>
          ) : (
            <HiddenHintBlock label="Слово скрыто" />
          )}

          {visibility.showTranslation ? (
            <div className="rounded-lg border border-sky-300/15 bg-sky-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-sky-200/80">Translation</p>
              <p className="mt-1 text-xl font-medium text-sky-50">{word.translation}</p>
            </div>
          ) : (
            <HiddenHintBlock label="Перевод скрыт" />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {visibility.showFirstLetter ? (
              <div className="muted-panel p-3">
                <p className="text-xs text-slate-500">Первая буква</p>
                <p className="mt-1 text-2xl font-semibold text-white">{word.english[0]?.toUpperCase()}</p>
              </div>
            ) : null}
            {visibility.showWordLength ? (
              <div className="muted-panel p-3">
                <p className="text-xs text-slate-500">Длина слова</p>
                <p className="mt-1 text-2xl font-semibold text-white">{word.english.length}</p>
              </div>
            ) : null}
          </div>

          {visibility.showAssociation ? (
            <div className="muted-panel p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Association</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{word.association || "Ассоциация не добавлена"}</p>
            </div>
          ) : (
            <HiddenHintBlock label="Ассоциация скрыта" />
          )}

          {visibility.showNotes && word.notes ? (
            <div className="muted-panel p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Notes</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{word.notes}</p>
            </div>
          ) : visibility.showNotes ? (
            <HiddenHintBlock label="Заметок нет" />
          ) : (
            <HiddenHintBlock label="Заметки скрыты" />
          )}
        </div>

        <div>
          {visibility.showImage ? (
            word.imageUrl && !imageBroken ? (
              <div className="overflow-hidden rounded-lg border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={word.imageUrl}
                  alt={word.english}
                  className="aspect-[16/12] w-full object-cover"
                  onError={() => setImageBroken(true)}
                />
              </div>
            ) : (
              <div className="flex aspect-[16/12] items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.04] text-sm text-slate-500">
                <ImageIcon className="mr-2 h-4 w-4" />
                Картинка не добавлена
              </div>
            )
          ) : (
            <HiddenHintBlock label="Картинка скрыта" />
          )}
        </div>
      </div>
    </section>
  );
}
