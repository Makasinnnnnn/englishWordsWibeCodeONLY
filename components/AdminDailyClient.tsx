"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Archive, Download, Eye, Pencil, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Textarea } from "@/components/Textarea";
import type { DailyContentView, SubtitlesStatus } from "@/lib/dailyContent";

export type AdminDailyRecord = {
  id: string;
  date: string;
  title: string;
  englishText: string;
  russianTranslation: string;
  textSource: string;
  videoTitle: string | null;
  videoUrl: string | null;
  videoSource: string | null;
  videoThumbnail: string | null;
  youtubeEmbedUrl: string | null;
  subtitlesStatus: SubtitlesStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

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

function formFromRecord(record: AdminDailyRecord): DailyAdminForm {
  return {
    id: record.id,
    date: dateInputValue(record.date),
    title: record.title,
    englishText: record.englishText,
    russianTranslation: record.russianTranslation,
    textSource: record.textSource,
    videoTitle: record.videoTitle ?? "",
    videoUrl: record.videoUrl ?? "",
    videoSource: record.videoSource ?? "",
    videoThumbnail: record.videoThumbnail ?? "",
    youtubeEmbedUrl: record.youtubeEmbedUrl ?? "",
    subtitlesStatus: record.subtitlesStatus,
    isActive: record.isActive
  };
}

function recordFromForm(form: DailyAdminForm, id: string, now = new Date().toISOString()): AdminDailyRecord {
  return {
    id,
    date: new Date(form.date).toISOString(),
    title: form.title,
    englishText: form.englishText,
    russianTranslation: form.russianTranslation,
    textSource: form.textSource,
    videoTitle: form.videoTitle || null,
    videoUrl: form.videoUrl || null,
    videoSource: form.videoSource || null,
    videoThumbnail: form.videoThumbnail || null,
    youtubeEmbedUrl: form.youtubeEmbedUrl || null,
    subtitlesStatus: form.subtitlesStatus,
    isActive: form.isActive,
    createdAt: now,
    updatedAt: now
  };
}

export function AdminDailyClient({
  initialContent,
  records: initialRecords,
  login,
  password,
  passwordRequired
}: {
  initialContent: DailyContentView;
  records: AdminDailyRecord[];
  login: string;
  password: string;
  passwordRequired: boolean;
}) {
  const [form, setForm] = useState<DailyAdminForm>(() => formFromContent(initialContent));
  const [records, setRecords] = useState<AdminDailyRecord[]>(initialRecords);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof DailyAdminForm>(key: K, value: DailyAdminForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function upsertRecord(record: AdminDailyRecord) {
    setRecords((current) => {
      const next = current.filter((item) => item.id !== record.id);
      return [record, ...next].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  }

  async function generateFromParser() {
    setBusy(true);
    setStatus("Подтягиваю контент из парсера...");

    try {
      const response = await fetch(
        `/api/admin/daily?mode=generate&login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,
        {
          cache: "no-store"
        }
      );
      const data = (await response.json()) as { content?: DailyContentView; error?: string };

      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "Не удалось подтянуть контент");
      }

      setForm(formFromContent(data.content));
      setStatus("Контент из парсера загружен. Проверьте текст, перевод и видео перед сохранением.");
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
        body: JSON.stringify({ ...form, login, password })
      });
      const data = (await response.json()) as { content?: AdminDailyRecord; error?: string };

      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "Не удалось сохранить контент");
      }

      const saved = {
        ...recordFromForm(form, data.content.id),
        ...data.content,
        date: new Date(data.content.date).toISOString(),
        createdAt: new Date(data.content.createdAt).toISOString(),
        updatedAt: new Date(data.content.updatedAt).toISOString()
      };

      setForm(formFromRecord(saved));
      upsertRecord(saved);
      setStatus("Контент дня сохранён.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось сохранить контент");
    } finally {
      setBusy(false);
    }
  }

  async function updateRecordState(record: AdminDailyRecord, mode: "archive" | "delete") {
    if (mode === "delete" && !window.confirm("Удалить этот выпуск контента дня без восстановления?")) {
      return;
    }

    setBusy(true);
    setStatus(mode === "delete" ? "Удаляю выпуск..." : "Архивирую выпуск...");

    try {
      const response = await fetch("/api/admin/daily", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ login, password, id: record.id, mode })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Не удалось обновить выпуск");
      }

      if (mode === "delete") {
        setRecords((current) => current.filter((item) => item.id !== record.id));
        if (form.id === record.id) {
          setForm(formFromContent(initialContent));
        }
      } else {
        const archived = { ...record, isActive: false, updatedAt: new Date().toISOString() };
        upsertRecord(archived);
        if (form.id === record.id) {
          update("isActive", false);
        }
      }

      setStatus(mode === "delete" ? "Выпуск удалён." : "Выпуск отправлен в архив.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось обновить выпуск");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void saveContent(event)}>
      {!passwordRequired ? (
        <div className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-50">
          ADMIN_LOGIN / ADMIN_PASSWORD не заданы, поэтому админка доступна авторизованному пользователю в dev-режиме.
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
              <Button type="button" variant="secondary" icon={<Eye className="h-4 w-4" />}>
                Открыть /daily
              </Button>
            </Link>
          </div>
        </div>
        {status ? <p className="mt-4 text-sm text-slate-400">{status}</p> : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid gap-5">
          <div className="panel space-y-4 p-5">
            <Input
              label="Дата публикации"
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
            />
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
            <Input
              label="Источник текста"
              value={form.textSource}
              onChange={(e) => update("textSource", e.target.value)}
            />
          </div>

          <div className="panel space-y-4 p-5">
            <Input
              label="Название видео"
              value={form.videoTitle}
              onChange={(e) => update("videoTitle", e.target.value)}
            />
            <Input label="YouTube URL" value={form.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} />
            <Input
              label="Источник видео"
              value={form.videoSource}
              onChange={(e) => update("videoSource", e.target.value)}
            />
            <Input
              label="Thumbnail URL"
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
        </div>

        <aside className="space-y-5">
          <div className="panel p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Предпросмотр</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{form.title || "Без заголовка"}</h3>
            <p className="mt-3 line-clamp-5 text-sm leading-6 text-slate-300">{form.englishText}</p>
            <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-400">{form.russianTranslation}</p>
            {form.youtubeEmbedUrl ? (
              <iframe
                className="mt-4 aspect-video w-full rounded-lg border border-white/10"
                src={form.youtubeEmbedUrl}
                title={form.videoTitle || "Daily video preview"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : null}
          </div>

          <div className="panel p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Сохранённые выпуски</p>
            <div className="mt-4 space-y-3">
              {records.length > 0 ? (
                records.map((record) => (
                  <div key={record.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{record.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {dateInputValue(record.date)} · {record.isActive ? "active" : "archived"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={<Pencil className="h-4 w-4" />}
                        onClick={() => setForm(formFromRecord(record))}
                      >
                        Редактировать
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={<Archive className="h-4 w-4" />}
                        disabled={busy || !record.isActive}
                        onClick={() => void updateRecordState(record, "archive")}
                      >
                        Архив
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="h-4 w-4" />}
                        disabled={busy}
                        onClick={() => void updateRecordState(record, "delete")}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-400">
                  Сохранённых выпусков пока нет.
                </p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </form>
  );
}
