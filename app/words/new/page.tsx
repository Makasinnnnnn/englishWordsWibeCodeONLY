import { WordForm } from "@/components/WordForm";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewWordPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-sm text-slate-500">Новое слово</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Добавление слова</h2>
      </div>
      <WordForm />
    </div>
  );
}
