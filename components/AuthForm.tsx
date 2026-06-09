"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { ZodError } from "zod";

import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { loginSchema, registerSchema } from "@/lib/validation/auth-schemas";

type AuthFormProps = {
  mode: "login" | "register";
  telegramBotUsername?: string;
};

type AuthResponse = {
  ok: boolean;
  error?: {
    message: string;
  };
};

export function AuthForm({ mode, telegramBotUsername }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";

  function afterAuth() {
    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    try {
      const payload = isRegister
        ? registerSchema.parse({ email, displayName, password, confirmPassword })
        : loginSchema.parse({ email, password });

      setSubmitting(true);
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as AuthResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message ?? "Auth failed");
      }

      showToast(isRegister ? "Аккаунт создан" : "Вход выполнен", "success");
      afterAuth();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(
          Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0] ?? "Invalid value"]))
        );
        return;
      }

      showToast(error instanceof Error ? error.message : "Не удалось выполнить вход", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel mx-auto max-w-md space-y-5 p-6 shadow-2xl shadow-sky-950/20" onSubmit={handleSubmit}>
      <div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/15 text-sky-100">
          {isRegister ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-sky-200/80">Word Memory Trainer</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{isRegister ? "Создать аккаунт" : "Войти в словарь"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isRegister
            ? "Email, пароль и прогресс будут храниться в вашем личном аккаунте."
            : "Введите email и пароль или продолжите через Telegram."}
        </p>
      </div>

      <TelegramLoginButton
        botUsername={telegramBotUsername}
        endpoint="/api/auth/telegram"
        label={isRegister ? "Register with Telegram" : "Continue with Telegram"}
        onSuccess={afterAuth}
      />

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-slate-600">
        <span className="h-px flex-1 bg-white/10" />
        Email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        error={errors.email}
        required
      />

      {isRegister ? (
        <Input
          label="Имя на экране"
          name="displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Например, Максим"
          error={errors.displayName}
          hint="Необязательно. Можно оставить пустым."
        />
      ) : null}

      <Input
        label="Пароль"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete={isRegister ? "new-password" : "current-password"}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
        hint={isRegister ? "Минимум 8 символов, буквы и цифры." : undefined}
        rightElement={
          <button
            type="button"
            className="focus-ring rounded-md p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        required
      />

      {isRegister ? (
        <Input
          label="Повторите пароль"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
          required
        />
      ) : null}

      {!isRegister ? (
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-sky-200 hover:text-sky-100">
            Забыли пароль?
          </Link>
        </div>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        className="w-full justify-center"
        icon={isRegister ? <ShieldCheck className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
        disabled={submitting}
      >
        {submitting ? "Проверяем..." : isRegister ? "Создать аккаунт" : "Войти"}
      </Button>

      <p className="text-center text-sm text-slate-400">
        {isRegister ? "Уже есть аккаунт?" : "Еще нет аккаунта?"}{" "}
        <Link href={isRegister ? "/login" : "/register"} className="text-sky-200 hover:text-sky-100">
          {isRegister ? "Войти" : "Создать"}
        </Link>
      </p>
    </form>
  );
}
