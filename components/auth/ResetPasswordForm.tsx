"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { ZodError } from "zod";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { resetPasswordSchema } from "@/lib/validation/auth-schemas";

type AuthResponse = {
  ok: boolean;
  data?: { message: string };
  error?: { message: string };
};

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage(undefined);

    try {
      const payload = resetPasswordSchema.parse({ token, password, confirmPassword });
      setSubmitting(true);
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as AuthResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message ?? "Не удалось обновить пароль");
      }

      setMessage(data.data?.message ?? "Пароль обновлен.");
      window.setTimeout(() => router.push("/login"), 900);
    } catch (caught) {
      if (caught instanceof ZodError) {
        const fieldErrors = caught.flatten().fieldErrors;
        setErrors(
          Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0] ?? "Invalid value"]))
        );
        return;
      }

      setErrors({ form: caught instanceof Error ? caught.message : "Не удалось обновить пароль" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel mx-auto max-w-md space-y-5 p-6 shadow-2xl shadow-sky-950/20" onSubmit={handleSubmit}>
      <div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/15 text-sky-100">
          <KeyRound className="h-5 w-5" />
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-sky-200/80">Word Memory Trainer</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Новый пароль</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Введите новый пароль для аккаунта.</p>
      </div>

      {errors.form ? (
        <p className="rounded-lg border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-50">{errors.form}</p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-50">
          {message}
        </p>
      ) : null}

      <Input
        label="Новый пароль"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
        hint="Минимум 8 символов, буквы и цифры."
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

      <Button type="submit" variant="primary" className="w-full" disabled={submitting || !token}>
        {submitting ? "Сохраняем..." : "Сохранить пароль"}
      </Button>

      <p className="text-center text-sm text-slate-400">
        <Link href="/login" className="text-sky-200 hover:text-sky-100">
          Вернуться ко входу
        </Link>
      </p>
    </form>
  );
}
