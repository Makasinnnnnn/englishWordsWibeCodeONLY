import { AdminDailyClient } from "@/components/AdminDailyClient";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { isAdminPasswordRequired, verifyAdminPassword } from "@/lib/admin";
import { requireUser } from "@/lib/auth";
import { getDailyContent } from "@/lib/dailyContent";

export const dynamic = "force-dynamic";

export default async function AdminDailyPage({ searchParams }: { searchParams?: { password?: string } }) {
  await requireUser();
  const password = searchParams?.password ?? "";
  const passwordRequired = isAdminPasswordRequired();
  const allowed = verifyAdminPassword(password);

  if (!allowed) {
    return (
      <section className="panel mx-auto max-w-md p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-sky-200/80">Admin</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Доступ к контенту дня</h2>
        <form className="mt-5 space-y-4" action="/admin/daily">
          <Input label="ADMIN_PASSWORD" name="password" type="password" autoComplete="current-password" />
          <Button type="submit" variant="primary">
            Войти
          </Button>
        </form>
      </section>
    );
  }

  const initialContent = await getDailyContent();

  return (
    <AdminDailyClient initialContent={initialContent} password={password} passwordRequired={passwordRequired} />
  );
}
