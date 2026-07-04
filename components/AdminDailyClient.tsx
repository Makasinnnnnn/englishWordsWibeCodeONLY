"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Download, Save } from "lucide-react";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Textarea } from "@/components/Textarea";
import type { DailyContentView, SubtitlesStatus } from "@/lib/dailyContent";

type DailyAdminForm = {
  id?: string;
  date: string;
  title: string;
  englishText: string;
  russianTranslation: string;
  textSource: string;
  videoTitle: string;
  videoUrl: string;
  videoSource: string;
  videoThumbnail: string;
  youtubeEmbedUrl: string;
  subtitlesStatus: SubtitlesStatus;
  isActive: boolean;
};

function dateInputValue(value?: string) {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().slice(0, 10);
}

function formFromContent(content: DailyContentView): DailyAdminForm {
  return {
    id: content.id,
    date: dateInputValue(content.date),
    title: content.title,
    englishText: content.paragraphEn,
    russianTranslation: content.paragraphRu,
    textSource: content.source,
    videoTitle: content.videoTitle,
    videoUrl: content.videoUrl,
    videoSource: content.videoSource,
    videoThumbnail: content.videoThumbnail ?? "",
    youtubeEmbedUrl: content.youtubeEmbedUrl,
    subtitlesStatus: content.subtitlesStatus,
    isActive: true
  };
}

export function AdminDailyClient({
  initialContent,
  password,
  passwordRequired
}: {
  initialContent: DailyContentView;
  password: string;
  passwordRequired: boolean;
}) {
  const [form, setForm] = useState<DailyAdminForm>(() => formFromContent(initialContent));
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof DailyAdminForm>(key: K, value: DailyAdminForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function generateFromParser() {
    setBusy(true);
    setStatus("Подтягиваю контент из парсера...");

    try {
      const response = await fetch(`/api/admin/daily?password=${encodeURIComponent(password)}`, {
        cache: "no-store"
      });
      const data = (await response.json()) as { content?: DailyContentView; error?: string };

      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "Не удалось подтянуть контент");
      }

      setForm(formFromContent(data.content));
      setStatus("Контент из парсера загружен. Проверьте поля и сохраните.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось подтянуть контент");
    } finally {
      setBusy(false);
    }
  }

  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      form.subtitlesStatus === "unknown" &&
      !window.confirm("Субтитры не подтверждены. Всё равно сохранить этот контент дня?")
    ) {
      return;
    }

    setBusy(true);
    setStatus("Сохраняю контент дня...");

    try {
      const response = await fetch("/api/admin/daily", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, password })
      });
      const data = (await response.json()) as { content?: { id: string }; error?: string };

      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "Не удалось сохранить контент");
      }

      update("id", data.content.id);
      setStatus("Контент дня сохранён.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось сохранить контент");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void saveContent(event)}>
      {!passwordRequired ? (
        <div className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-50">
          ADMIN_PASSWORD не задан, поэтому админка доступна авторизованному пользователю в dev-режиме.
        </div>
      ) : null}

      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sky-200/80">Admin daily</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Контент дня</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() => void generateFromParser()}
              disabled={busy}
            >
              Подтянуть из парсера
            </Button>
            <Button type="submit" variant="primary" icon={<Save className="h-4 w-4" />} disabled={busy}>
              Сохранить
            </Button>
            <Link href="/daily">
              <Button type="button" variant="secondary">
                Открыть /daily
              </Button>
            </Link>
          </div>
        </div>
        {status ? <p className="mt-4 text-sm text-slate-400">{status}</p> : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="panel space-y-4 p-5">
          <Input label="Дата публикации" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
          <Input label="Заголовок" value={form.title} onChange={(e) => update("title", e.target.value)} />
          <Textarea
            label="Английский текст"
            value={form.englishText}
            onChange={(e) => update("englishText", e.target.value)}
          />
          <Textarea
            label="Перевод"
            value={form.russianTranslation}
            onChange={(e) => update("russianTranslation", e.target.value)}
          />
          <Input label="Источник текста" value={form.textSource} onChange={(e) => update("textSource", e.target.value)} />
        </div>

        <div className="panel space-y-4 p-5">
          <Input label="Название видео" value={form.videoTitle} onChange={(e) => update("videoTitle", e.target.value)} />
          <Input label="Ссылка на видео" value={form.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} />
          <Input label="Источник видео" value={form.videoSource} onChange={(e) => update("videoSource", e.target.value)} />
          <Input
            label="Thumbnail"
            value={form.videoThumbnail}
            onChange={(e) => update("videoThumbnail", e.target.value)}
          />
          <Input
            label="YouTube embed URL"
            value={form.youtubeEmbedUrl}
            onChange={(e) => update("youtubeEmbedUrl", e.target.value)}
          />
          <Select
            label="Статус английских субтитров"
            value={form.subtitlesStatus}
            onChange={(e) => update("subtitlesStatus", e.target.value as SubtitlesStatus)}
          >
            <option value="confirmed">confirmed</option>
            <option value="likely">likely</option>
            <option value="unknown">unknown</option>
          </Select>
          <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
              className="h-4 w-4"
            />
            Активен
          </label>
        </div>
      </section>
    </form>
  );
}
