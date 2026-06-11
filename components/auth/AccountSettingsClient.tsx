"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LinkIcon, LogOut, Trash2, Unlink } from "lucide-react";
import { ZodError } from "zod";

import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useToast } from "@/components/Toast";
import { setPasswordSchema } from "@/lib/validation/auth-schemas";

type AccountSettingsClientProps = {
  telegramBotUsername?: string;
  account: {
    email: string | null;
    emailVerifiedAt: string | null;
    displayName: string | null;
    hasPassword: boolean;
    telegram: {
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      photoUrl: string | null;
    } | null;
  };
};

type AuthResponse = {
  ok: boolean;
  error?: { message: string };
};

export function AccountSettingsClient({ account, telegramBotUsername }: AccountSettingsClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState(account.email ?? "");
  const [displayName, setDisplayName] = useState(account.displayName ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function submitSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    try {
      const payload = setPasswordSchema.parse({ email, displayName, password, confirmPassword });
      setSubmitting(true);
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as AuthResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message ?? "Не удалось сохранить email и пароль");
      }

      setPassword("");
      setConfirmPassword("");
      showToast("Email и пароль сохранены", "success");
      router.refresh();
    } catch (caught) {
      if (caught instanceof ZodError) {
        const fieldErrors = caught.flatten().fieldErrors;
        setErrors(
          Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0] ?? "Invalid value"]))
        );
        return;
      }

      showToast(caught instanceof Error ? caught.message : "Не удалось сохранить email и пароль", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function unlinkTelegram() {
    const response = await fetch("/api/auth/telegram/link", { method: "DELETE" });
    const data = (await response.json()) as AuthResponse;

    if (!response.ok || !data.ok) {
      showToast(data.error?.message ?? "Не удалось отвязать Telegram", "error");
      return;
    }

    showToast("Telegram отвязан", "success");
    router.refresh();
  }

  async function logoutAll() {
    await fetch("/api/auth/logout-all", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function deleteAccount() {
    if (deleteConfirmation !== "DELETE") {
      setErrors({ delete: "Введите DELETE для подтверждения" });
      return;
    }

    const response = await fetch("/api/account", { method: "DELETE" });
    const data = (await response.json()) as AuthResponse;

    if (!response.ok || !data.ok) {
      showToast(data.error?.message ?? "Не удалось удалить аккаунт", "error");
      return;
    }

    router.push("/login");
    router.refresh();
  }

  const telegramLabel = account.telegram
    ? [account.telegram.firstName, account.telegram.lastName].filter(Boolean).join(" ") ||
      account.telegram.username ||
      "Telegram подключен"
    : "Telegram не подключен";

  return (
    <div className="space-y-5">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Account</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Способы входа</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="muted-panel p-4">
            <p className="text-sm text-slate-400">Email</p>
            <p className="mt-2 break-all text-lg font-semibold text-white">{account.email ?? "Не добавлен"}</p>
            <p className="mt-1 text-xs text-slate-500">
              {account.hasPassword
                ? account.emailVerifiedAt
                  ? "Email/password вход активен. Email подтверждён."
                  : "Email/password вход активен. Email ожидает подтверждения."
                : "Добавьте email и пароль как запасной способ входа."}
            </p>
          </div>
          <div className="muted-panel p-4">
            <p className="text-sm text-slate-400">Telegram</p>
            <p className="mt-2 break-all text-lg font-semibold text-white">{telegramLabel}</p>
            <p className="mt-1 text-xs text-slate-500">
              {account.telegram ? "Можно входить через Telegram." : "Можно привязать Telegram к текущему аккаунту."}
            </p>
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Telegram</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Привязка Telegram</h2>
          </div>
          {account.telegram ? (
            <Button
              type="button"
              variant="danger"
              icon={<Unlink className="h-4 w-4" />}
              onClick={() => void unlinkTelegram()}
            >
              Отвязать
            </Button>
          ) : null}
        </div>
        <div className="mt-4">
          {account.telegram ? (
            <p className="text-sm text-slate-400">
              Telegram уже привязан. Если это единственный способ входа, сначала добавьте email и пароль.
            </p>
          ) : (
            <TelegramLoginButton
              botUsername={telegramBotUsername}
              endpoint="/api/auth/telegram/link"
              label="Link Telegram"
              onSuccess={() => router.refresh()}
            />
          )}
        </div>
      </section>

      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Password</p>
        <h2 className="mt-1 text-xl font-semibold text-white">
          {account.hasPassword ? "Изменить email и пароль" : "Добавить email и пароль"}
        </h2>
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={submitSetPassword}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            required
          />
          <Input
            label="Имя на экране"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            error={errors.displayName}
          />
          <Input
            label="Новый пароль"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            required
          />
          <Input
            label="Повторите пароль"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
            required
          />
          <div className="md:col-span-2">
            <Button type="submit" variant="primary" icon={<KeyRound className="h-4 w-4" />} disabled={submitting}>
              {submitting ? "Сохраняем..." : "Сохранить email и пароль"}
            </Button>
          </div>
        </form>
      </section>

      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Sessions</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            icon={<LogOut className="h-4 w-4" />}
            onClick={() => void logoutAll()}
          >
            Выйти на всех устройствах
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={<LinkIcon className="h-4 w-4" />}
            onClick={() => router.push("/settings")}
          >
            Настройки тренировок
          </Button>
        </div>
      </section>

      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Appearance</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Тема интерфейса</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Выберите светлую, тёмную или системную тему. Настройка сохранится на этом устройстве.
        </p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </section>

      <section className="panel border-red-400/20 p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-red-200/70">Danger zone</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Удалить аккаунт</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Будут удалены аккаунт, сессии, Telegram-привязка, reset-токены и все слова этого пользователя.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            label="Введите DELETE"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            error={errors.delete}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => void deleteAccount()}
            >
              Удалить аккаунт
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
