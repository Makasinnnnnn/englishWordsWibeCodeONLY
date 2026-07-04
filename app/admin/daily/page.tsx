import { AdminDailyClient } from "@/components/AdminDailyClient";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import type { AdminDailyRecord } from "@/components/AdminDailyClient";
import { isAdminPasswordRequired, verifyAdminCredentials } from "@/lib/admin";
import { requireUser } from "@/lib/auth";
import { getDailyContent } from "@/lib/dailyContent";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDailyPage({
  searchParams
}: {
  searchParams?: { login?: string; password?: string };
}) {
  await requireUser();
  const login = searchParams?.login ?? "";
  const password = searchParams?.password ?? "";
  const passwordRequired = isAdminPasswordRequired();
  const allowed = verifyAdminCredentials(login, password);

  if (!allowed) {
    return (
      <section className="panel mx-auto max-w-md p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-sky-200/80">Admin</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Доступ к контенту дня</h2>
        <form className="mt-5 space-y-4" action="/admin/daily">
          <Input label="ADMIN_LOGIN" name="login" type="text" autoComplete="username" />
          <Input label="ADMIN_PASSWORD" name="password" type="password" autoComplete="current-password" />
          <Button type="submit" variant="primary">
            Войти
          </Button>
        </form>
      </section>
    );
  }

  const initialContent = await getDailyContent();
  const records = await prisma.dailyContent.findMany({
    orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
    take: 30
  });

  return (
    <AdminDailyClient
      initialContent={initialContent}
      records={records.map(
        (record): AdminDailyRecord => ({
          ...record,
          date: record.date.toISOString(),
          subtitlesStatus: record.subtitlesStatus as AdminDailyRecord["subtitlesStatus"],
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString()
        })
      )}
      login={login}
      password={password}
      passwordRequired={passwordRequired}
    />
  );
}
