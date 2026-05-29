"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageIcon, RefreshCw } from "lucide-react";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { cn } from "@/utils/cn";

type ImagePickerProps = {
  value: string;
  onChange: (value: string) => void;
  word: string;
  association: string;
};

function ImageFallback({ label = "Preview" }: { label?: string }) {
  return (
    <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.04] text-sm text-slate-500">
      <ImageIcon className="mr-2 h-4 w-4" />
      {label}
    </div>
  );
}

export function ImagePicker({ value, onChange, word, association }: ImagePickerProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewBroken, setPreviewBroken] = useState(false);

  const loadSuggestions = useCallback(async () => {
    if (!word.trim() && !association.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ word, association });
      const response = await fetch(`/api/suggest/images?${params.toString()}`);
      const data = (await response.json()) as { images: string[] };
      setSuggestions(data.images ?? []);
    } finally {
      setLoading(false);
    }
  }, [association, word]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadSuggestions();
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [loadSuggestions]);

  useEffect(() => {
    setPreviewBroken(false);
  }, [value]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input label="Association image" value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://..." />
        </div>
        <Button type="button" variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadSuggestions()} disabled={loading}>
          Обновить
        </Button>
      </div>

      {value && !previewBroken ? (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.035]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Выбранная ассоциация" className="aspect-[16/10] w-full object-cover" onError={() => setPreviewBroken(true)} />
        </div>
      ) : (
        <ImageFallback label={value ? "Картинка не загрузилась" : "Preview выбранной картинки"} />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {suggestions.map((image) => {
          const isSelected = value === image;

          return (
            <button
              key={image}
              type="button"
              className={cn(
                "group overflow-hidden rounded-lg border bg-white/[0.035] text-left transition hover:border-sky-300/50",
                isSelected ? "border-sky-300/70" : "border-white/10"
              )}
              onClick={() => onChange(image)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Вариант картинки" className="aspect-[16/10] w-full object-cover transition group-hover:scale-[1.02]" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
