"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { ZodError } from "zod";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { forgotPasswordSchema } from "@/lib/validation/auth-schemas";

type AuthResponse = {
  ok: boolean;
  data?: { message: string };
  error?: { message: string };
};

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setMessage(undefined);

    try {
      const payload = forgotPasswordSchema.parse({ email });
      setSubmitting(true);
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as AuthResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message ?? "Не удалось отправить ссылку");
      }

      setMessage(data.data?.message ?? "Если аккаунт найден, мы отправили ссылку для восстановления пароля.");
    } catch (caught) {
      if (caught instanceof ZodError) {
        setError(caught.flatten().fieldErrors.email?.[0]);
        return;
      }

      setError(caught instanceof Error ? caught.message : "Не удалось отправить ссылку");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel mx-auto max-w-md space-y-5 p-6 shadow-2xl shadow-sky-950/20" onSubmit={handleSubmit}>
      <div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/15 text-sky-100">
          <Mail className="h-5 w-5" />
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-sky-200/80">Word Memory Trainer</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Восстановление пароля</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Введите email. Если аккаунт существует, мы отправим ссылку для сброса пароля.
        </p>
      </div>

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={error}
        required
      />

      {message ? (
        <p className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-50">
          {message}
        </p>
      ) : null}

      <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
        {submitting ? "Отправляем..." : "Отправить ссылку"}
      </Button>

      <p className="text-center text-sm text-slate-400">
        <Link href="/login" className="text-sky-200 hover:text-sky-100">
          Вернуться ко входу
        </Link>
      </p>
    </form>
  );
}
