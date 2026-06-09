"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, RefreshCw, Trash2, Upload } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewBroken, setPreviewBroken] = useState(false);
  const isUploadedImage = value.startsWith("data:image/");

  const loadSuggestions = useCallback(async () => {
    if (!word.trim() && !association.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ word, association });
      const response = await fetch(`/api/suggest/images?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load images");
      }
      const data = (await response.json()) as { images: string[] };
      setSuggestions(data.images ?? []);
    } catch {
      setError("Не удалось загрузить предложения картинок");
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

  function handleFileChange(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Выберите файл изображения");
      return;
    }

    if (file.size > 1_500_000) {
      setError("Картинка слишком большая. Выберите файл до 1.5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setError("");
        onChange(reader.result);
      }
    };
    reader.onerror = () => setError("Не удалось прочитать файл");
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <Input
            label="Association image"
            value={isUploadedImage ? "Загружена пользовательская картинка" : value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Вставьте ссылку https://..."
            disabled={isUploadedImage}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFileChange(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="secondary"
          icon={<Upload className="h-4 w-4" />}
          onClick={() => fileInputRef.current?.click()}
        >
          Загрузить свою
        </Button>
        <Button
          type="button"
          variant="secondary"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void loadSuggestions()}
          disabled={loading}
        >
          {loading ? "Загрузка..." : "Обновить"}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            icon={<Trash2 className="h-4 w-4" />}
            aria-label="Очистить картинку"
            onClick={() => onChange("")}
          />
        ) : null}
      </div>
      <p className="text-xs text-slate-500">
        Можно выбрать картинку из предложений, вставить URL или загрузить свою картинку с компьютера.
      </p>
      {error ? <p className="text-xs text-amber-300">{error}</p> : null}

      {value && !previewBroken ? (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.035]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Выбранная ассоциация"
            className="aspect-[16/10] w-full object-cover"
            onError={() => setPreviewBroken(true)}
          />
        </div>
      ) : (
        <ImageFallback label={value ? "Картинка не загрузилась" : "Preview выбранной картинки"} />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="aspect-[16/10] animate-pulse rounded-lg border border-white/10 bg-white/[0.05]"
              />
            ))
          : null}
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
              <img
                src={image}
                alt="Вариант картинки"
                className="aspect-[16/10] w-full object-cover transition group-hover:scale-[1.02]"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
