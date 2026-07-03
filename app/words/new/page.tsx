import Link from "next/link";

import { Button } from "@/components/Button";
import { WordForm } from "@/components/WordForm";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewWordPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Личный словарь</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Добавить своё слово</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Это слово попадёт в ваш личный словарь и старые режимы тренировки. Для дефолтной колоды карточек используйте
            отдельный редактор.
          </p>
        </div>
        <Link href="/cards/dictionary">
          <Button type="button" variant="secondary">
            Редактировать карточки
          </Button>
        </Link>
      </div>
      <WordForm />
    </div>
  );
}
